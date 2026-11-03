// Requires Playwright (`require('playwright')`): preinstalled in the cloud container; elsewhere `npm i --no-save playwright`.
// Browser playtest of a game page with the real guide handler and browser assets and a
// deterministic mock agent. No model or network calls. Usage:
//   node tools/game-playtest/playtest.mjs <slug> <outDir> [width=1280] [--log-fails] [--g3] [--min-reply-seen=60]
// Exits 1 when, after any turn, less than --min-reply-seen % of the guide's latest reply is in view (or of the
// panel's visible message area, for a reply longer than that area).
// --log-fails makes the game log start fail like the production database before the
// slug migration (game_sessions_slug_check), so the player-facing behavior can be observed.
// --g3 adds player moves shaped like the observed Dayton G3 replay excerpt
// (tests/fixtures/game-r35-playtest.observed.json, moves 7/23/26 and the R3.5 hint-mention
// cases) and records whether the server kept its rules: a question after reading, an
// off-topic question inside a challenge, »… Namig prosim.« at the end of a question, and a
// hint that is only mentioned. The mock answers player questions with one neutral line.
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { makeHandler } from '../../functions/game-guide.mjs';
import { loadGame, playerQuestion } from '../../functions/lib/game-guide/runtime.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = fileURLToPath(new URL('../../', import.meta.url));
const [slug = 'tesla1888', outDir = path.join(root, 'evidence', 'playtest'), widthArg = '1280'] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const width = Number(widthArg), logFails = process.argv.includes('--log-fails'), g3 = process.argv.includes('--g3');
// Runs at the same width must not overwrite each other's screenshots and JSON.
const tag = logFails ? '-logfail' : g3 ? '-g3' : '', ANSWER = 'Tega podatka v zgodbi ni.';
await mkdir(outDir, { recursive: true });
const gameJson = JSON.parse(await readFile(path.join(root, 'public/game', slug, 'game.json'), 'utf8'));
const byId = Object.fromEntries(gameJson.steps.map(s => [s.id, s]));
const report = { slug, width, logFails, g3, turns: [], g3Probes: [], shots: [], modelRounds: 0, logEvents: 0, logStartErrors: 0, console: [], pageErrors: [], badResponses: [], screenshots: [], findings: [] };

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
    const asked = playerQuestion(message);
    const use = (name, args) => calls.push({ name, arguments: args, call_id: `call_${++call}` });
    if (results.some(r => r.visible === true && !r.already_open)) text = asked ? ANSWER : '';
    else if (last && last.ok === false) text = 'Razumem. Povej mi svojo zamisel.';
    else if (ctx.sealed_key) {
      const id = ctx.sealed_key.challenge, step = byId[id];
      const hints = (ctx.sealed_key.hints || []).filter(h => !ctx.opened.some(s => s.id === h.id));
      if (ctx.learning.cards[id]) use('open_step', { id: ctx.sealed_key.reveal[0].id });
      else if (/namig/i.test(message) && hints.length) use('open_step', { id: hints[0].id });
      else if (/^Moja zamisel/i.test(message) && !ctx.learning.asked.includes(id)) use('ask_understanding', { step: id, idea: step.key_ideas[0], question: 'Zakaj bi to delovalo?' });
      else if (/^Razlaga/i.test(message)) use('assess_challenge', { step: id, path: 'historical', achieved: step.key_ideas, why: 'Mehanizem je razložen.', advantages: [] });
      else text = asked ? `${ANSWER} Kaj predlagaš?` : 'Kaj predlagaš?';
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
const measure = () => page.evaluate(() => {
  const panel = document.getElementById('game-guide')?.getBoundingClientRect();
  // How much of a message the player sees without scrolling. The window is the viewport cut by every ancestor
  // that clips (#gg-messages on wide screens, #gg-body on phones, whichever scrolls). pct = share of the
  // message; fit = share of what fits in that window (100 when a reply longer than the window fills it).
  const seen = el => {
    if (!el) return { pct: null, fit: null };
    let top = 0, bottom = innerHeight;
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      if (getComputedStyle(a).overflowY === 'visible') continue;
      const b = a.getBoundingClientRect(); top = Math.max(top, b.top + a.clientTop); bottom = Math.min(bottom, b.top + a.clientTop + a.clientHeight);
    }
    const r = el.getBoundingClientRect(), px = Math.max(0, Math.min(r.bottom, bottom) - Math.max(r.top, top));
    return { pct: Math.round(100 * px / Math.max(1, r.height)), fit: Math.round(100 * px / Math.max(1, Math.min(r.height, bottom - top))) };
  };
  const last = role => [...document.querySelectorAll(`.gg-message[data-role=${role}]`)].at(-1), reply = seen(last('assistant'));
  return { overflow: document.documentElement.scrollWidth - innerWidth, panelShare: panel && innerWidth < 900 ? Math.round(100 * Math.min(panel.height, innerHeight) / innerHeight) : null,
    replySeenPct: reply.pct, replyFitPct: reply.fit, replyPx: Math.round(last('assistant')?.getBoundingClientRect().height ?? 0) || null, userSeenPct: seen(last('user')).pct, pageY: Math.round(scrollY) };
});
const shot = async name => {
  const file = path.join(outDir, `${slug}-${width}${tag}-${name}.jpg`); await page.screenshot({ path: file, type: 'jpeg', quality: 70 });
  report.screenshots.push(path.basename(file)); report.shots.push({ name, ...(await measure()) });
};
const visible = () => page.evaluate(() => [...document.querySelectorAll('section.g-step')].filter(s => !s.hidden).map(s => s.id));
const lastAssistant = () => page.evaluate(() => [...document.querySelectorAll('.gg-message[data-role=assistant]')].map(m => m.textContent.trim()).at(-1) || '');
async function waitIdle() {
  await page.waitForFunction(() => !document.getElementById('gg-send').disabled || document.getElementById('gg-input').disabled === false, null, { timeout: 30000 }).catch(() => { });
  await page.waitForTimeout(250);
}
async function send(text) {
  const before = await visible(), t0 = Date.now();
  await page.fill('#gg-input', text); await page.click('#gg-send'); await page.waitForTimeout(200); await waitIdle();
  const after = await visible(), ms = Date.now() - t0, { replySeenPct, replyFitPct, userSeenPct } = await measure();
  const turn = { send: text, opened: after.filter(id => !before.includes(id)), reply: (await lastAssistant()).slice(0, 220), ms, replySeenPct, replyFitPct, userSeenPct };
  report.turns.push(turn); return turn;
}
// One G3-shaped player move: what was sent, what opened, how many model rounds it took, and whether the rule held.
async function probe(kind, at, text, expect) {
  const rounds = report.modelRounds, t = await send(text);
  report.g3Probes.push({ kind, at, send: text, opened: t.opened, reply: t.reply, modelRounds: report.modelRounds - rounds, ok: expect(t) });
  return t;
}

await page.goto(`${base}/game/${slug}/`, { waitUntil: 'load' });
await page.waitForFunction(() => !document.getElementById('gg-start').disabled, null, { timeout: 20000 }).catch(() => report.findings.push('start button never became enabled'));
await shot('01-start');
if (await page.isVisible('#gg-consent-wrap')) { await page.check('#gg-consent').catch(() => { }); report.consentChecked = true; }
await page.click('#gg-start').catch(() => report.findings.push('start click failed'));
await page.waitForTimeout(400); await waitIdle();
const { replySeenPct, replyFitPct, userSeenPct } = await measure();
report.turns.push({ send: '(start)', opened: await visible(), reply: (await lastAssistant()).slice(0, 220), replySeenPct, replyFitPct, userSeenPct });
report.logInfoAfterStart = await page.textContent('#gg-log-info').catch(() => null);
report.statusAfterStart = await page.textContent('#gg-status').catch(() => null);
await shot('02-after-start');

const challenges = gameJson.steps.filter(s => s.kind === 'challenge');
let guard = 0, shotChallenge = false; const probed = new Set();
while (guard++ < 160) {
  const vis = await visible();
  if (vis.includes(gameJson.steps.at(-1).id)) break;
  const active = challenges.find(c => vis.includes(c.id) && !gameJson.steps.some(s => s.kind === 'reveal' && s.for === c.id && vis.includes(s.id)));
  if (!active && g3 && !probed.has('S')) {
    probed.add('S'); // G3 move 7: »Ok, prebral.« plus a question about the story; expect the next step and an answer.
    const t = await probe('S', vis.at(-1), 'Ok, prebral. Zakaj pa tega ni odkril že kdo pred njim?', t => t.opened.length === 1 && t.reply.startsWith(ANSWER));
    if (t.opened.length) continue;
  }
  if (!active) { const t = await send('Naprej.'); if (!t.opened.length) { const t2 = await send('Prebral sem, odpri naslednji korak.'); if (!t2.opened.length) { report.findings.push(`stuck after ${vis.at(-1)}`); break; } } continue; }
  const hints = gameJson.steps.filter(s => s.kind === 'hint' && s.for === active.id);
  const openHints = hints.filter(h => vis.includes(h.id));
  if (g3 && !openHints.length && !probed.has('A' + active.id)) {
    probed.add('A' + active.id); // G3 move 23: an off-topic question inside a challenge; expect an answer and no step.
    await probe('A', active.id, 'Zanimivo. Koliko je pa to takrat stalo?', t => !t.opened.length && t.reply.startsWith(ANSWER)); continue;
  }
  if (g3 && openHints.length === 1 && hints.length > 1 && !probed.has('C' + active.id)) {
    probed.add('C' + active.id); // R3.5: a hint that is only mentioned is not a request; the mock tries anyway, the server must refuse.
    await probe('C', active.id, 'Iz prvega namiga razumem samo del.', t => !t.opened.length); continue;
  }
  if (g3 && !openHints.length) {
    // G3 move 26: »… Namig prosim.« at the end of a question opens exactly the first hint.
    const t = await probe('B', active.id, 'Kako naj pa to naredim, saj nisem fizik? Namig prosim.', t => t.opened.join() === hints[0].id);
    if (!t.opened.length) report.findings.push(`hint request opened nothing at ${active.id}`);
    continue;
  }
  if (openHints.length < hints.length) { const t = await send('Namig, prosim.'); if (!t.opened.length) { report.findings.push(`hint request opened nothing at ${active.id}`); } continue; }
  if (!shotChallenge) { await page.locator('#' + hints.at(-1).id).scrollIntoViewIfNeeded(); await shot('03-challenge-hints'); }
  const a = await send(`Moja zamisel: ${active.key_ideas[0]}`);
  const b = await send(`Razlaga: ${active.key_ideas.join(' ')}`);
  if (!shotChallenge) { await shot('04-assessed'); }
  // The server may open the reveal in the assessment turn already; only then is »Naprej.« the next step,
  // so check the reveal itself instead of "something opened".
  const reveal = gameJson.steps.find(s => s.kind === 'reveal' && s.for === active.id).id;
  let r = b;
  if (!(await visible()).includes(reveal)) { r = await send('Naprej.'); if (!r.opened.includes(reveal)) r = await send('Pokaži razkritje.'); }
  if (!(await visible()).includes(reveal)) { report.findings.push(`reveal did not open for ${active.id} (replies: ${a.reply} | ${b.reply} | ${r.reply})`); break; }
  (report.revealOpenedBy ??= {})[active.id] = r.send.split(':')[0];
  if (!shotChallenge) { await page.locator('#' + reveal).scrollIntoViewIfNeeded(); await shot('05-reveal'); shotChallenge = true; }
}
await page.waitForTimeout(300);
const final = await visible();
report.allStepsOpened = gameJson.steps.every(s => final.includes(s.id));
report.missingSteps = gameJson.steps.filter(s => !final.includes(s.id)).map(s => s.id);
report.finalReply = await lastAssistant();
report.logInfoEnd = await page.textContent('#gg-log-info').catch(() => null);
report.statusEnd = await page.textContent('#gg-status').catch(() => null);
report.cardLines = (report.finalReply.match(/Kartica/g) || []).length;
// Lazy images that were never scrolled into view would pass a complete/naturalWidth check
// unloaded; load every image first, then check.
report.layout = await page.evaluate(async () => {
  const images = [...document.images];
  await Promise.all(images.map(i => { i.loading = 'eager'; return Promise.race([i.decode().catch(() => { }), new Promise(r => setTimeout(r, 8000))]); }));
  return { vw: innerWidth, sw: document.documentElement.scrollWidth, images: images.length,
    brokenImages: images.filter(i => !i.complete || i.naturalWidth === 0).map(i => i.getAttribute('src')),
    imgNoAlt: images.filter(i => !(i.getAttribute('alt') || '').trim()).map(i => i.getAttribute('src')) };
});
const ms = report.turns.map(t => t.ms).filter(Number.isFinite).sort((a, b) => a - b);
report.turnMs = { count: ms.length, median: ms[ms.length >> 1] ?? null, max: ms.at(-1) ?? null };
await shot('06-end');
// Regression check: after every turn the guide's latest reply must be on screen (or fill the visible part of
// the panel when it is longer). On phones it was 0 % before game-guide.js also scrolled #gg-body.
// --log-fails turns add no reply, so they are not checked.
const minSeen = Number(process.argv.find(a => a.startsWith('--min-reply-seen='))?.split('=')[1] ?? 60);
const fits = report.turns.map(t => t.replyFitPct).filter(Number.isFinite), low = logFails ? [] : report.turns.filter(t => Number.isFinite(t.replyFitPct) && t.replyFitPct < minSeen);
report.replyFit = { min: fits.length ? Math.min(...fits) : null, required: logFails ? null : minSeen, turns: fits.length, below: low.length };
for (const t of low.slice(0, 5)) report.findings.push(`latest reply ${t.replyFitPct}% in view after »${t.send.slice(0, 40)}«`);
if (low.length > 5) report.findings.push(`… and ${low.length - 5} more turns with the latest reply out of view`);
if (low.length) process.exitCode = 1;
await page.screenshot({ path: path.join(outDir, `${slug}-${width}${tag}-full.jpg`), type: 'jpeg', quality: 55, fullPage: true }).catch(() => { });
await writeFile(path.join(outDir, `${slug}-${width}${tag}.json`), JSON.stringify(report, null, 1));
console.log(JSON.stringify({ slug, width, logFails, turns: report.turns.length, modelRounds: report.modelRounds, allStepsOpened: report.allStepsOpened, missing: report.missingSteps.length,
  cardLines: report.cardLines, findings: report.findings, console: report.console.length, pageErrors: report.pageErrors.length, bad: report.badResponses.length,
  overflow: Math.max(report.layout.sw - report.layout.vw, ...report.shots.map(s => s.overflow)), images: report.layout.images, broken: report.layout.brokenImages.length, noAlt: report.layout.imgNoAlt.length,
  replySeenPct: report.shots.map(s => s.replySeenPct), replyFitMin: report.replyFit.min, replyFitBelow: report.replyFit.below, userSeenPct: report.shots.map(s => s.userSeenPct), panelSharePct: report.shots.some(s => s.panelShare != null) ? Math.max(...report.shots.map(s => s.panelShare ?? 0)) : null, turnMs: report.turnMs,
  ...(g3 ? { g3: `${report.g3Probes.filter(p => p.ok).length}/${report.g3Probes.length}` } : {}), logInfo: report.logInfoAfterStart }));
await browser.close(); server.close();
