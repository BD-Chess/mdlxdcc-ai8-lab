// Requires Playwright (`require('playwright')`): preinstalled in the cloud container; elsewhere `npm i --no-save playwright`.
// Browser playtest of a game page with the real guide handler and browser assets and a
// deterministic mock agent. No model or network calls. Usage:
//   node tools/game-playtest/playtest.mjs <slug> <outDir> [width=1280] [--log-fails]
// --log-fails makes the game log start fail like the production database before the
// slug migration (game_sessions_slug_check), so the player-facing behavior can be observed.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { makeHandler } from '../../functions/game-guide.mjs';
import { loadGame } from '../../functions/lib/game-guide/runtime.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = fileURLToPath(new URL('../../', import.meta.url));
const [slug = 'tesla1888', outDir = path.join(root, 'evidence', 'playtest'), widthArg = '1280'] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const width = Number(widthArg), logFails = process.argv.includes('--log-fails');
await mkdir(outDir, { recursive: true });
const gameJson = JSON.parse(await readFile(path.join(root, 'public/game', slug, 'game.json'), 'utf8'));
const byId = Object.fromEntries(gameJson.steps.map(s => [s.id, s]));
const report = { slug, width, logFails, turns: [], modelRounds: 0, logEvents: 0, logStartErrors: 0, console: [], pageErrors: [], badResponses: [], screenshots: [], findings: [] };

const localFetch = async url => {
  const rel = new URL(url).pathname.replace(/^\/+/, '');
  const file = path.join(root, 'public', rel.endsWith('/') ? rel + 'index.html' : rel);
  try { const body = await readFile(file); return new Response(body, { headers: { 'content-length': String(body.length) } }); }
  catch { return new Response('missing', { status: 404 }); }
};
const toolResults = input => input.flatMap(m => m.type === 'function_call_output' ? [JSON.parse(m.output)]
  : Array.isArray(m.content) ? m.content.filter(c => c.type === 'tool_result').map(c => JSON.parse(c.content)) : []);
let call = 0;
const handler = makeHandler({
  accessFactory: async () => ({ role: 'owner', id: 'playtest-owner' }), configured: { claude: true, gpt: true },
  continuationSecret: () => 'local-playtest-secret-only-'.repeat(3), clientFactory: async () => ({}), budgetFactory: () => ({}),
  gameFactory: (s, opts = {}) => loadGame(s, { ...opts, fetcher: localFetch }),
  logStore: {
    start: async () => {
      if (logFails) { report.logStartErrors++; throw Object.assign(Error('new row for relation "game_sessions" violates check constraint "game_sessions_slug_check"'), { code: '23514' }); }
      return { id: '12345678-1234-4234-8234-123456789abc' };
    },
    append: async (_, events) => { report.logEvents += events.length; },
  },
  round: async ({ provider, system, input, onText }) => {
    report.modelRounds++;
    const ctx = JSON.parse(system.split('KONTEKST IGRE (podatki):\n')[1]);
    const results = toolResults(input), last = results.at(-1);
    const message = input.filter(m => m.role === 'user' && typeof m.content === 'string')
      .map(m => { try { return JSON.parse(m.content).message; } catch { return null; } }).filter(Boolean).at(-1) || '';
    let text = '', calls = [];
    const use = (name, args) => calls.push({ name, arguments: args, call_id: `call_${++call}` });
    if (results.some(r => r.visible === true && !r.already_open)) text = '';
    else if (last && last.ok === false) text = 'Razumem. Povej mi svojo zamisel.';
    else if (ctx.sealed_key) {
      const id = ctx.sealed_key.challenge, step = byId[id];
      const hints = (ctx.sealed_key.hints || []).filter(h => !ctx.opened.some(s => s.id === h.id));
      if (ctx.learning.cards[id]) use('open_step', { id: ctx.sealed_key.reveal[0].id });
      else if (/namig/i.test(message) && hints.length) use('open_step', { id: hints[0].id });
      else if (/^Moja zamisel/i.test(message) && !ctx.learning.asked.includes(id)) use('ask_understanding', { step: id, idea: step.key_ideas[0], question: 'Zakaj bi to delovalo?' });
      else if (/^Razlaga/i.test(message)) use('assess_challenge', { step: id, path: 'historical', achieved: step.key_ideas, why: 'Mehanizem je razložen.', advantages: [] });
      else text = 'Kaj predlagaš?';
    } else if (ctx.next) use('open_step', { id: ctx.next.id });
    else text = 'Igra je končana.';
    onText(text);
    const response = provider === 'claude'
      ? { content: [...(text ? [{ type: 'text', text }] : []), ...calls.map(c => ({ type: 'tool_use', id: c.call_id, name: c.name, input: c.arguments }))] }
      : { output: [...(text ? [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text }] }] : []), ...calls.map(c => ({ type: 'function_call', ...c, arguments: JSON.stringify(c.arguments) }))] };
    return { text, calls: provider === 'claude' ? calls : calls.map(c => ({ ...c, arguments: JSON.stringify(c.arguments) })), response };
  },
});
const types = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/.netlify/functions/game-guide')) {
      let raw = ''; for await (const chunk of req) raw += chunk;
      const answer = await handler(new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers: req.headers, ...(raw ? { body: raw } : {}) }));
      res.writeHead(answer.status, Object.fromEntries(answer.headers)); res.end(Buffer.from(await answer.arrayBuffer())); return;
    }
    let pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (pathname.endsWith('/')) pathname += 'index.html';
    const body = await readFile(path.join(root, 'public', pathname));
    res.writeHead(200, { 'Content-Type': types[path.extname(pathname)] || 'application/octet-stream' }); res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: width < 600 ? 780 : 900 }, deviceScaleFactor: 2, isMobile: width < 600, hasTouch: width < 600 });
page.on('console', m => { if (m.type() === 'error') report.console.push(m.text().slice(0, 200)); });
page.on('pageerror', e => report.pageErrors.push(String(e.message).slice(0, 200)));
page.on('response', r => { if (r.status() >= 400) report.badResponses.push(`${r.status()} ${r.url().replace(base, '')}`); });
page.on('request', r => { if (!r.url().startsWith(base) && !r.url().startsWith('data:')) report.badResponses.push('external ' + r.url()); });
const shot = async name => { const file = path.join(outDir, `${slug}-${width}-${name}.jpg`); await page.screenshot({ path: file, type: 'jpeg', quality: 70 }); report.screenshots.push(path.basename(file)); };
const visible = () => page.evaluate(() => [...document.querySelectorAll('section.g-step')].filter(s => !s.hidden).map(s => s.id));
const lastAssistant = () => page.evaluate(() => [...document.querySelectorAll('.gg-message[data-role=assistant]')].map(m => m.textContent.trim()).at(-1) || '');
async function waitIdle() {
  await page.waitForFunction(() => !document.getElementById('gg-send').disabled || document.getElementById('gg-input').disabled === false, null, { timeout: 30000 }).catch(() => { });
  await page.waitForTimeout(250);
}
async function send(text) {
  const before = await visible(), t0 = Date.now();
  await page.fill('#gg-input', text); await page.click('#gg-send'); await page.waitForTimeout(200); await waitIdle();
  const after = await visible();
  const turn = { send: text, opened: after.filter(id => !before.includes(id)), reply: (await lastAssistant()).slice(0, 220), ms: Date.now() - t0 };
  report.turns.push(turn); return turn;
}

await page.goto(`${base}/game/${slug}/`, { waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('gg-start').disabled, null, { timeout: 20000 }).catch(() => report.findings.push('start button never became enabled'));
await shot('01-start');
if (await page.isVisible('#gg-consent-wrap')) { await page.check('#gg-consent').catch(() => { }); report.consentChecked = true; }
await page.click('#gg-start').catch(() => report.findings.push('start click failed'));
await page.waitForTimeout(400); await waitIdle();
report.turns.push({ send: '(start)', opened: await visible(), reply: (await lastAssistant()).slice(0, 220) });
report.logInfoAfterStart = await page.textContent('#gg-log-info').catch(() => null);
report.statusAfterStart = await page.textContent('#gg-status').catch(() => null);
await shot('02-after-start');

const challenges = gameJson.steps.filter(s => s.kind === 'challenge');
let guard = 0, shotChallenge = false;
while (guard++ < 160) {
  const vis = await visible();
  if (vis.includes(gameJson.steps.at(-1).id)) break;
  const active = challenges.find(c => vis.includes(c.id) && !gameJson.steps.some(s => s.kind === 'reveal' && s.for === c.id && vis.includes(s.id)));
  if (!active) { const t = await send('Naprej.'); if (!t.opened.length) { const t2 = await send('Prebral sem, odpri naslednji korak.'); if (!t2.opened.length) { report.findings.push(`stuck after ${vis.at(-1)}`); break; } } continue; }
  const hints = gameJson.steps.filter(s => s.kind === 'hint' && s.for === active.id);
  const openHints = hints.filter(h => vis.includes(h.id));
  if (openHints.length < hints.length) { const t = await send('Namig, prosim.'); if (!t.opened.length) { report.findings.push(`hint request opened nothing at ${active.id}`); } continue; }
  if (!shotChallenge) { await page.locator('#' + hints.at(-1).id).scrollIntoViewIfNeeded(); await shot('03-challenge-hints'); }
  const a = await send(`Moja zamisel: ${active.key_ideas[0]}`);
  const b = await send(`Razlaga: ${active.key_ideas.join(' ')}`);
  if (!shotChallenge) { await shot('04-assessed'); }
  let r = await send('Naprej.');
  if (!r.opened.length) r = await send('Pokaži razkritje.');
  if (!r.opened.length) { report.findings.push(`reveal did not open for ${active.id} (replies: ${a.reply} | ${b.reply} | ${r.reply})`); break; }
  if (!shotChallenge) { await shot('05-reveal'); shotChallenge = true; }
}
await page.waitForTimeout(300);
const final = await visible();
report.allStepsOpened = gameJson.steps.every(s => final.includes(s.id));
report.missingSteps = gameJson.steps.filter(s => !final.includes(s.id)).map(s => s.id);
report.finalReply = await lastAssistant();
report.logInfoEnd = await page.textContent('#gg-log-info').catch(() => null);
report.statusEnd = await page.textContent('#gg-status').catch(() => null);
report.cardLines = (report.finalReply.match(/Kartica/g) || []).length;
report.layout = await page.evaluate(() => ({ vw: innerWidth, sw: document.documentElement.scrollWidth,
  brokenImages: [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')),
  imgNoAlt: [...document.images].filter(i => !i.hasAttribute('alt')).map(i => i.getAttribute('src')) }));
await shot('06-end');
await page.screenshot({ path: path.join(outDir, `${slug}-${width}-full.jpg`), type: 'jpeg', quality: 55, fullPage: true }).catch(() => { });
await writeFile(path.join(outDir, `${slug}-${width}${logFails ? '-logfail' : ''}.json`), JSON.stringify(report, null, 1));
console.log(JSON.stringify({ slug, width, logFails, turns: report.turns.length, modelRounds: report.modelRounds, allStepsOpened: report.allStepsOpened, missing: report.missingSteps.length,
  cardLines: report.cardLines, findings: report.findings, console: report.console.length, pageErrors: report.pageErrors.length, bad: report.badResponses.length, overflow: report.layout.sw - report.layout.vw, logInfo: report.logInfoAfterStart }));
await browser.close(); server.close();
