// Browser regression check: after a typed turn the guide's latest reply must be in view in whichever panel
// element scrolls (#gg-messages on wide screens, #gg-body on phones), and the page the player is reading must
// not move. Real handler and browser assets, the _fixture game, a mock agent; no model or network calls.
// Requires Playwright (`require('playwright')`); GAME_GUIDE_BROWSER may name a Chromium executable.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { makeHandler } from '../functions/game-guide.mjs';
import { loadGame } from '../functions/lib/game-guide/runtime.mjs';

let chromium = null;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch {}
const root = fileURLToPath(new URL('../', import.meta.url));
const SHORT = 'Kroglica se ustavi, ker jo zavira trenje.\nPomisli, kaj bi videl na gladki plošči.\nKaj predlagaš?';
const LONG = Array.from({ length: 30 }, (_, i) => `Vrstica ${i + 1}: daljši odgovor vodnika, ki ne gre v okno.`).join('\n');

const localFetch = async url => {
  const rel = new URL(url).pathname.replace(/^\/+/, '');
  try { const body = await readFile(path.join(root, 'public', rel.endsWith('/') ? rel + 'index.html' : rel)); return new Response(body); }
  catch { return new Response('missing', { status: 404 }); }
};
const handler = makeHandler({
  accessFactory: async () => ({ role: 'owner', id: 'visibility-test' }), configured: { claude: true, gpt: true },
  continuationSecret: () => 'local-visibility-secret-only-'.repeat(3), clientFactory: async () => ({}), budgetFactory: () => ({}),
  gameFactory: (slug, opts = {}) => loadGame(slug, { ...opts, fetcher: localFetch }),
  logStore: { start: async () => ({ id: '12345678-1234-4234-8234-123456789abc' }), append: async () => {} },
  round: async ({ system, input, onText }) => {
    const ctx = JSON.parse(system.split('KONTEKST IGRE (podatki):\n')[1]);
    const message = input.filter(m => m.role === 'user' && typeof m.content === 'string')
      .map(m => { try { return JSON.parse(m.content).message; } catch { return null; } }).filter(Boolean).at(-1) || '';
    const answered = input.some(m => m.type === 'function_call_output' || (Array.isArray(m.content) && m.content.some(c => c.type === 'tool_result')));
    const calls = !answered && /^Začniva/.test(message) && ctx.next ? [{ name: 'open_step', arguments: { id: ctx.next.id }, call_id: 'call_start' }] : [];
    const text = calls.length ? '' : /^Dolg/.test(message) ? LONG : SHORT;
    onText(text);
    return { text, calls, response: { content: [...(text ? [{ type: 'text', text }] : []), ...calls.map(c => ({ type: 'tool_use', id: c.call_id, name: c.name, input: c.arguments }))] } };
  },
});
const types = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    if (req.url.startsWith('/.netlify/functions/game-guide')) {
      let raw = ''; for await (const chunk of req) raw += chunk;
      const answer = await handler(new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers: req.headers, ...(raw ? { body: raw } : {}) }));
      res.writeHead(answer.status, Object.fromEntries(answer.headers)); res.end(Buffer.from(await answer.arrayBuffer())); return;
    }
    let pathname = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.resolve(root, 'public', '.' + pathname);
    if (!file.startsWith(path.join(root, 'public') + path.sep)) throw Error('outside public');
    res.writeHead(200, { 'Content-Type': types[path.extname(pathname)] || 'application/octet-stream' }); res.end(await readFile(file));
  } catch { res.writeHead(404); res.end('not found'); }
});

// What the player sees of the latest reply and of their own last message: each box cut by the viewport and by
// every clipping ancestor. fit = visible share of the message, or of the window when the message is longer.
const measure = page => page.evaluate(() => {
  const seen = el => {
    let top = 0, bottom = innerHeight;
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      if (getComputedStyle(a).overflowY === 'visible') continue;
      const b = a.getBoundingClientRect(); top = Math.max(top, b.top + a.clientTop); bottom = Math.min(bottom, b.top + a.clientTop + a.clientHeight);
    }
    const r = el.getBoundingClientRect(), px = Math.max(0, Math.min(r.bottom, bottom) - Math.max(r.top, top));
    return { fit: Math.round(100 * px / Math.max(1, Math.min(r.height, bottom - top))), startInView: r.top >= top - 1 && r.top < bottom };
  };
  const last = role => [...document.querySelectorAll(`.gg-message[data-role=${role}]`)].at(-1);
  return { ...seen(last('assistant')), userFit: seen(last('user')).fit, pageY: scrollY, text: last('assistant').textContent };
});
async function turn(page, text) {
  await page.fill('#gg-input', text);
  const before = await page.evaluate(() => scrollY);
  await page.click('#gg-send');
  await page.waitForFunction(() => document.querySelector('#gg-status').textContent !== '' && !document.getElementById('gg-mode').disabled && !/razmišlja/.test(document.querySelector('#gg-status').textContent), null, { timeout: 15000 });
  await page.waitForTimeout(150);
  return { before, ...(await measure(page)) };
}

const layouts = [
  { name: 'phone 360x780', viewport: { width: 360, height: 780 }, mobile: true, bothFit: true },
  { name: 'desktop 1280x900', viewport: { width: 1280, height: 900 }, mobile: false, bothFit: true },
  // A short desktop window: here #gg-body overflows too, so both panel scrollers are involved.
  { name: 'short desktop 1280x480', viewport: { width: 1280, height: 480 }, mobile: false, bothFit: false },
];

test('the latest guide reply is in view after each turn and the page does not move', { skip: chromium ? false : 'playwright is not installed' }, async t => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch(process.env.GAME_GUIDE_BROWSER ? { executablePath: process.env.GAME_GUIDE_BROWSER } : {});
  t.after(async () => { await browser.close(); server.close(); });
  for (const layout of layouts) await t.test(layout.name, async () => {
    const page = await browser.newPage({ viewport: layout.viewport, isMobile: layout.mobile, hasTouch: layout.mobile });
    const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(`http://127.0.0.1:${server.address().port}/game/_fixture/`);
    await page.waitForFunction(() => !document.getElementById('gg-start').disabled, null, { timeout: 15000 });
    await page.click('#gg-start');
    await page.waitForFunction(() => !document.getElementById('s2').hidden && !document.getElementById('gg-mode').disabled, null, { timeout: 15000 });
    await page.waitForTimeout(800); // let the smooth page scroll to the opened step finish
    // The player reads the page somewhere else; a reply must not move it.
    await page.evaluate(() => scrollTo(0, Math.round(document.documentElement.scrollHeight / 3)));
    const short = await turn(page, 'Vprašanje: zakaj se kroglica ustavi?');
    assert.ok(short.before > 0, `${layout.name}: the page must be scrolled for the check to mean anything`);
    assert.match(short.text, /Kaj predlagaš/);
    assert.ok(short.fit >= 95, `${layout.name}: short reply ${short.fit}% in view`);
    assert.equal(short.pageY, short.before, `${layout.name}: the page moved from ${short.before} to ${short.pageY}`);
    // Where the player's message and a short reply fit together, both are in view.
    if (layout.bothFit) assert.ok(short.userFit >= 95, `${layout.name}: the player's own message ${short.userFit}% in view`);
    const long = await turn(page, 'Dolg odgovor, prosim.');
    assert.match(long.text, /Vrstica 30/);
    assert.ok(long.fit >= 60, `${layout.name}: long reply fills only ${long.fit}% of the panel's message area`);
    assert.equal(long.pageY, long.before, `${layout.name}: the page moved from ${long.before} to ${long.pageY}`);
    // On phones #gg-body scrolls; a reply longer than the panel shows its beginning there.
    if (layout.mobile) assert.ok(long.startInView, `${layout.name}: the long reply's first line is out of view`);
    assert.deepEqual(errors, []);
    await page.close();
  });
});
