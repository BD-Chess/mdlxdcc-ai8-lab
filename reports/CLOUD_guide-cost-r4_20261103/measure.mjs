// Offline prompt-size and prompt-cache ESTIMATE for the "Pred izumom" game guide (R4 cost work).
// No network, no API keys, no model calls. The real handler (functions/game-guide.mjs) and the real
// shared transport (providerRound) run against a fake provider client that records every request
// payload and answers with a deterministic mock agent. A scripted player plays each game to the end.
//
//   node reports/CLOUD_guide-cost-r4_20261103/measure.mjs <label> [out.json]
//
// Token counts are ESTIMATES: characters / 3.5 (no tokenizer is available offline).
// Cache numbers are a MODEL of the providers' documented prefix caching, not measured usage.
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { makeHandler } from '../../functions/game-guide.mjs';
import { stepTexts } from '../../functions/lib/game-guide/content.mjs';

const ROOT = new URL('../../', import.meta.url);
const SLUGS = ['dayton1903', 'faraday1831', 'navierstokes1845', 'tesla1888'];
const CHARS_PER_TOKEN = 3.5;
const tokens = chars => chars / CHARS_PER_TOKEN;
// USD per million tokens. Claude Opus 5.5 list prices from the claude-api skill (cached 2026-10-06):
// $4 input, $20 output, 5-minute cache write 1.25x = $5, cache read $0.20. GPT-6.1-sol from the
// constants in functions/lib/mdlxdcc-guide/cost.mjs: $2 input, $10 output, $0.10 cached, $2.50 write.
// The in-code budget charge() adds a 10% regional allowance on top; list prices are used here.
const PRICE = {
  claude: { model: 'claude-opus-5-5', input: 4, write: 5, read: 0.2, output: 20 },
  gpt: { model: 'gpt-6.1-sol', input: 2, write: 2.5, read: 0.1, output: 10 }
};
// Output tokens are NOT measurable offline (they include thinking/reasoning at effort low).
// Assumption band per provider round, identical before and after; used only for the total.
const OUTPUT_TOKENS = { low: 150, mid: 300, high: 600 };

const games = Object.fromEntries(await Promise.all(SLUGS.map(async slug => [slug, stepTexts(
  await readFile(new URL(`public/game/${slug}/index.html`, ROOT), 'utf8'),
  JSON.parse(await readFile(new URL(`public/game/${slug}/game.json`, ROOT), 'utf8')))])));

// ---------- prompt parsing (supports the old Slovenian and the new English layout) ----------
const systemText = system => Array.isArray(system) ? system.map(b => b.text).join('') : String(system);
function contextOf(text) {
  for (const marker of ['KONTEKST IGRE (podatki):\n', 'GAME CONTEXT (data):\n']) if (text.includes(marker)) return JSON.parse(text.split(marker)[1]);
  throw Error('no context marker');
}
const toolResults = items => items.flatMap(m => m.type === 'function_call_output' ? [JSON.parse(m.output)]
  : Array.isArray(m.content) ? m.content.filter(c => c.type === 'tool_result').map(c => JSON.parse(c.content)) : []);
const playerIndex = items => items.findLastIndex(m => m.role === 'user' && typeof m.content === 'string' && m.content.startsWith('{"message"'));

// ---------- deterministic mock agent ----------
const ANSWER = 'V odprtem besedilu piše, da so to takrat preverjali s preprostimi poskusi in skrbnim zapisovanjem rezultatov, ne z drago opremo. Natančnejšega podatka o načinu merjenja v odprtem besedilu ni.';
function agent(payload, provider) {
  const ctx = contextOf(systemText(provider === 'claude' ? payload.system : payload.instructions));
  const items = provider === 'claude' ? payload.messages : payload.input, at = playerIndex(items);
  const message = JSON.parse(items[at].content).message, results = toolResults(items.slice(at + 1)), last = results.at(-1);
  const allowed = ctx.allowed_open_steps || [], key = ctx.sealed_key, game = games[ctx.slug];
  const text = value => ({ text: value, calls: [] }), call = (name, args) => ({ text: '', calls: [{ name, args }] });
  if (results.some(r => r.visible === true && !r.already_open)) return text('Na desni je nov korak; preberi ga.');
  if (last?.wait_for_player) return text('Kaj bi se po tvoje zgodilo na drugi strani?');
  if (last?.card_prepared) { const reveal = allowed.find(s => s.kind === 'reveal'); return reveal ? call('open_step', { id: reveal.id }) : text('Dobro razloženo. Želiš odgovor dopolniti ali naj odprem razkritje?'); }
  if (last && last.ok === false) return text('Razumem. Povej mi, kako bi to rešil ti.');
  if (/\?\s*$/.test(message)) return text(ANSWER);
  if (/namig/i.test(message)) { const hint = allowed.find(s => s.kind === 'hint'); return hint ? call('open_step', { id: hint.id }) : text('Namiga zdaj ni.'); }
  if (key && /^Moja zamisel/.test(message) && !ctx.learning.asked.includes(key.challenge)) {
    const step = game.steps.find(s => s.id === key.challenge);
    return call('ask_understanding', { step: step.id, idea: step.key_ideas[1] ?? step.key_ideas[0], question: 'Kaj bi se po tvoje zgodilo na drugi strani?' });
  }
  if (key && /^Razlaga/.test(message)) {
    const step = game.steps.find(s => s.id === key.challenge);
    return call('assess_challenge', { step: step.id, achieved: step.key_ideas, path: 'historical', why: 'Igralec je razložil vse mejnike mehanizma.', advantages: [] });
  }
  const next = allowed.find(s => s.kind !== 'hint');
  return next ? call('open_step', { id: next.id }) : text('Kaj predlagaš?');
}
let callSeq = 0;
function fakeClient(provider, sink) {
  if (provider === 'claude') return { messages: { stream(payload) {
    sink.push(structuredClone(payload));
    const out = agent(payload, provider), content = [...(out.text ? [{ type: 'text', text: out.text }] : []),
      ...out.calls.map(c => ({ type: 'tool_use', id: `toolu_${++callSeq}`, name: c.name, input: c.args }))];
    const response = { content, stop_reason: out.calls.length ? 'tool_use' : 'end_turn', usage: { input_tokens: 0, output_tokens: 0 } };
    return { async *[Symbol.asyncIterator]() { if (out.text) yield { type: 'content_block_delta', delta: { type: 'text_delta', text: out.text } }; }, finalMessage: async () => response };
  } } };
  return { responses: { async create(payload) {
    sink.push(structuredClone(payload));
    const out = agent(payload, provider), output = [...(out.text ? [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: out.text }] }] : []),
      ...out.calls.map(c => ({ type: 'function_call', call_id: `call_${++callSeq}`, name: c.name, arguments: JSON.stringify(c.args) }))];
    const response = { output, status: 'completed', usage: { input_tokens: 0, output_tokens: 0 } };
    return (async function* () { if (out.text) yield { type: 'response.output_text.delta', delta: out.text }; yield { type: 'response.completed', response }; })();
  } } };
}

// ---------- scripted player (mirrors the browser client's request body) ----------
async function playGame(slug, provider) {
  const game = games[slug], payloads = [], turns = [];
  const handler = makeHandler({ accessFactory: async () => ({ role: 'owner', id: 'offline-cost-r4' }), configured: { claude: true, gpt: true },
    continuationSecret: () => 'offline-cost-r4-fixture-only-'.repeat(3), gameFactory: async () => structuredClone(game),
    clientFactory: async () => fakeClient(provider, payloads), budgetFactory: () => ({ reserve: async () => null, settle: async () => {} }),
    logStore: { start: async () => null } });
  let opened = [game.steps[0].id], learning = { asked: [], cards: {} }, transcript = [];
  const post = async body => {
    const response = await handler(new Request('https://www.mdlxdcc.org/.netlify/functions/game-guide', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));
    if (response.status !== 200) throw Error(`HTTP ${response.status} ${await response.text()}`);
    return (await response.text()).split('\n\n').filter(Boolean).map(f => JSON.parse(f.slice(6)));
  };
  async function send(message) {
    const before = payloads.length, events = [];
    let body = { slug, provider, mode: 'IZUMLJAJ', development: false, game_session_id: null, log_consent: false, protocol: 'game-guide-tools-v1',
      message, opened: [...opened], learning, history: transcript.slice(-12).map(m => ({ ...m, content: m.content.slice(0, 3500) })),
      fair_play: { paste_events: 0, paste_length: 0, typing_ms: 12000, blur_ms: 0 } };
    for (let hop = 0; hop < 4; hop++) {
      const batch = await post(body); events.push(...batch);
      for (const a of batch.filter(e => e.type === 'action' && e.name === 'open_step')) if (!opened.includes(a.id)) opened.push(a.id);
      const state = batch.find(e => e.type === 'state'); if (state) learning = state.learning;
      const token = batch.find(e => e.type === 'continue')?.token; if (!token) break;
      body = { continuation: token, receipts: batch.filter(e => e.type === 'action' && e.call_id).map(a => ({ call_id: a.call_id, name: a.name, opened: a.id, ok: true, visible: true, already_open: false })) };
    }
    const error = events.find(e => e.type === 'error'), done = events.find(e => e.type === 'done');
    if (error || !done || done.recovered) throw Error(`${slug}/${provider} turn "${message}" failed: ${JSON.stringify(error || done || events.at(-1))}`);
    const reply = events.filter(e => e.type === 'delta').map(e => e.text).join('');
    transcript.push({ role: 'user', content: message }, ...(reply ? [{ role: 'assistant', content: reply }] : []));
    turns.push({ message, rounds: payloads.length - before });
  }
  await send('Začniva.');
  const phase = {};
  for (let guard = 0; guard < 300 && !opened.includes(game.steps.at(-1).id); guard++) {
    const active = game.steps.filter(s => s.kind === 'challenge' && opened.includes(s.id) && !game.steps.some(r => r.kind === 'reveal' && r.for === s.id && opened.includes(r.id))).at(-1);
    if (!active) { const n = opened.length; await send('Naprej.'); if (opened.length === n) throw Error(`${slug}: stuck after ${opened.at(-1)}`); continue; }
    const p = phase[active.id] = (phase[active.id] ?? -1) + 1;
    const script = ['Namig, prosim.', 'Kako so to takrat sploh merili?', `Moja zamisel: ${active.key_ideas[0]}`, `Razlaga: ${active.key_ideas.join('; ')}.`, 'Naprej.'];
    if (p >= script.length) throw Error(`${slug}: reveal for ${active.id} never opened`);
    await send(script[p]);
  }
  return { payloads, turns };
}

// ---------- rendering and cache models ----------
const strip = value => { if (Array.isArray(value)) return value.map(strip); if (value && typeof value === 'object') { const { cache_control, ...rest } = value; return Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, strip(v)])); } return value; };
const blockChars = block => typeof block === 'string' ? block.length : block.type === 'text' ? block.text.length
  : block.type === 'tool_use' ? block.name.length + JSON.stringify(block.input).length : block.type === 'tool_result' ? String(block.content).length : JSON.stringify(strip(block)).length;
// Claude renders tools -> system -> messages; caching is by block position, read at breakpoints
// (cache_control) with a 20-position lookback, written up to the last breakpoint (5-minute TTL).
function claudeBlocks(payload) {
  const out = [];
  for (const t of payload.tools || []) out.push({ part: 'tools', key: JSON.stringify(strip(t)), chars: JSON.stringify(strip(t)).length, bp: Boolean(t.cache_control) });
  const system = Array.isArray(payload.system) ? payload.system : [{ type: 'text', text: payload.system }];
  for (const b of system) out.push({ part: 'system', key: b.text, chars: b.text.length, bp: Boolean(b.cache_control) });
  for (const m of payload.messages) for (const c of typeof m.content === 'string' ? [m.content] : m.content)
    out.push({ part: 'messages', key: m.role + JSON.stringify(strip(c)), chars: blockChars(c), bp: Boolean(c?.cache_control) });
  let h = '';
  for (const b of out) b.hash = h = createHash('sha256').update(h + '␞' + b.key).digest('hex');
  return out;
}
// GPT: automatic prefix caching (>= 1024 tokens, 128-token steps). Assumed render order is
// instructions -> tools -> input (as in OpenAI's published harmony format); tools-first is reported too.
function gptRender(payload, toolsFirst = false) {
  const tools = JSON.stringify(payload.tools), instr = payload.instructions;
  const input = payload.input.map(m => m.type === 'function_call_output' ? `<out ${m.call_id}>${m.output}` : m.type === 'function_call' ? `<call ${m.name}>${m.arguments}`
    : m.type === 'message' ? `<${m.role}>${m.content.map(c => c.text).join('')}` : `<${m.role}>${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`).join('\n');
  return toolsFirst ? `${tools}\n${instr}\n${input}` : `${instr}\n${tools}\n${input}`;
}
const lcp = (a, b) => { let i = 0; const n = Math.min(a.length, b.length); while (i < n && a.charCodeAt(i) === b.charCodeAt(i)) i++; return i; };
const gptCached = chars => { const t = tokens(chars); return t >= 1024 ? Math.floor(t / 128) * 128 : 0; };

function analyse(provider, payloads, turnOf) {
  const rows = [], claudeEntries = new Map(), claudeTurnEntries = new Map(), seen = [];
  payloads.forEach((p, i) => {
    const sys = systemText(provider === 'claude' ? p.system : p.instructions), toolsChars = JSON.stringify(provider === 'claude' ? strip(p.tools) : p.tools).length;
    const items = provider === 'claude' ? p.messages : p.input, messagesChars = items.reduce((a, m) => a + (typeof m.content === 'string' ? m.content.length
      : Array.isArray(m.content) ? m.content.reduce((x, c) => x + blockChars(c), 0) : m.type === 'function_call_output' ? m.output.length : m.type === 'function_call' ? m.arguments.length + m.name.length : 0), 0);
    const row = { round: i + 1, turn: turnOf[i], tools: toolsChars, system: sys.length, messages: messagesChars, total: toolsChars + sys.length + messagesChars };
    // Composition of the context JSON (same keys in both layouts).
    const ctx = contextOf(sys), size = v => v === undefined ? 0 : JSON.stringify(v).length;
    row.parts = { rules: sys.indexOf(sys.includes('KONTEKST IGRE (podatki):\n') ? 'KONTEKST IGRE (podatki):\n' : 'GAME CONTEXT (data):\n'), opened: size(ctx.opened), sealed_key: size(ctx.sealed_key),
      learning: size(ctx.learning), learning_cards: size(ctx.learning.cards), challenge_answers: size(ctx.challenge_answers),
      transitions: size(ctx.allowed_open_steps) + size(ctx.reveal_after_assessment) + size(ctx.reveal_on_player_choice) + size(ctx.next) + size(ctx.mode) };
    // Identical-prefix diagnostics against the previous round (provider-neutral text render).
    const flat = `${JSON.stringify(provider === 'claude' ? strip(p.tools) : p.tools)}\n${sys}\n${JSON.stringify(strip(items))}`;
    row.lcp_prev = i ? lcp(flat, seen[i - 1]) : 0; seen.push(flat);
    if (provider === 'claude') {
      const blocks = claudeBlocks(p), cum = []; blocks.reduce((a, b, k) => (cum[k] = a + b.chars), 0);
      row.total = cum.at(-1);
      const breakpoints = blocks.map((b, k) => b.bp ? k : -1).filter(k => k >= 0);
      const simulate = entries => {
        let read = 0;
        for (const b of breakpoints) for (let j = b; j >= Math.max(0, b - 20); j--) if (entries.has(blocks[j].hash)) { read = Math.max(read, cum[j]); break; }
        const end = breakpoints.length ? cum[breakpoints.at(-1)] : 0;
        for (const b of breakpoints) entries.set(blocks[b].hash, true);
        return { read, write: Math.max(0, end - read), fresh: row.total - Math.max(end, read) };
      };
      // warm: every entry written earlier in this game is still alive (all turn gaps < 5 minutes).
      // cold: entries expire between player turns; only rounds of the same turn reuse them.
      if (i && turnOf[i] !== turnOf[i - 1]) claudeTurnEntries.clear();
      row.warm = simulate(claudeEntries); row.cold = simulate(claudeTurnEntries);
      row.stable_prefix = breakpoints.length ? cum[breakpoints[0]] : 0;
    } else {
      const render = gptRender(p), renderToolsFirst = gptRender(p, true);
      const best = (list, r) => list.reduce((m, x) => Math.max(m, lcp(r, x)), 0);
      row.gptRenders = { render, renderToolsFirst };
      const prior = rows.map(r => r.gptRenders.render), priorTF = rows.map(r => r.gptRenders.renderToolsFirst);
      const turnPrior = rows.filter(r => r.turn === turnOf[i]).map(r => r.gptRenders.render);
      const total = render.length;
      const mk = cachedTok => ({ read: cachedTok * CHARS_PER_TOKEN, write: 0, fresh: total - cachedTok * CHARS_PER_TOKEN });
      row.warm = mk(gptCached(best(prior, render))); row.cold = mk(gptCached(best(turnPrior, render)));
      row.warm_tools_first = mk(gptCached(best(priorTF, renderToolsFirst)));
      row.total = total;
    }
    rows.push(row);
  });
  for (const r of rows) delete r.gptRenders;
  return rows;
}
function cost(provider, rows, scenario, outputTokens) {
  const P = PRICE[provider]; let usd = 0, read = 0, all = 0;
  for (const r of rows) {
    const s = r[scenario];
    // GPT: uncached tokens at the input rate; the write-rate variant is reported separately.
    usd += (tokens(s.fresh) * P.input + tokens(s.write) * P.write + tokens(s.read) * P.read + outputTokens * P.output) / 1e6;
    read += s.read; all += r.total;
  }
  return { usd, cache_read_share: all ? read / all : 0 };
}

const label = process.argv[2] || 'run', outFile = process.argv[3];
const summary = { label, method: { tokens: `ESTIMATE chars/${CHARS_PER_TOKEN}`, prices_usd_per_mtok: PRICE, output_tokens_per_round_assumption: OUTPUT_TOKENS,
  claude_cache: '5-minute TTL; reads at cache_control breakpoints with 20-block lookback; no breakpoints = no caching',
  gpt_cache: 'automatic prefix cache >=1024 tokens in 128-token steps; render order instructions->tools->input (tools-first also reported)',
  scenarios: { warm: 'cache entries survive between player turns', cold: 'cache entries expire between player turns (reuse only within one turn)' } }, games: [] };
for (const slug of SLUGS) for (const provider of ['claude', 'gpt']) {
  const { payloads, turns } = await playGame(slug, provider);
  const turnOf = turns.flatMap((t, i) => Array(t.rounds).fill(i + 1));
  const rows = analyse(provider, payloads, turnOf);
  const sum = key => rows.reduce((a, r) => a + r[key], 0), sumS = (s, k) => rows.reduce((a, r) => a + r[s][k], 0);
  const first = rows[0], lastRow = rows.at(-1);
  const g = { slug, provider, turns: turns.length, rounds: rows.length,
    input_chars: sum('total'), input_tokens_est: Math.round(tokens(sum('total'))), avg_round_tokens_est: Math.round(tokens(sum('total')) / rows.length),
    first_round_tokens_est: Math.round(tokens(first.total)), last_round_tokens_est: Math.round(tokens(lastRow.total)),
    parts_tokens_est: { tools: Math.round(tokens(sum('tools'))), system: Math.round(tokens(sum('system'))), messages: Math.round(tokens(sum('messages'))) },
    avg_round_composition_tokens_est: Object.fromEntries(['tools', 'messages'].map(k => [k, Math.round(tokens(sum(k)) / rows.length)])
      .concat(Object.keys(first.parts).map(k => [k, Math.round(tokens(rows.reduce((a, r) => a + r.parts[k], 0)) / rows.length)]))),
    identical_prefix_with_previous_round_share: sum('lcp_prev') / sum('total'),
    stable_prefix_tokens_est: provider === 'claude' ? Math.round(tokens(first.stable_prefix)) : null,
    scenarios: {} };
  for (const s of ['warm', 'cold', ...(provider === 'gpt' ? ['warm_tools_first'] : [])]) {
    g.scenarios[s] = { read_tokens_est: Math.round(tokens(sumS(s, 'read'))), write_tokens_est: Math.round(tokens(sumS(s, 'write'))), fresh_tokens_est: Math.round(tokens(sumS(s, 'fresh'))),
      cache_read_share: +(sumS(s, 'read') / sum('total')).toFixed(4),
      usd_input_only: +cost(provider, rows, s, 0).usd.toFixed(4),
      usd_total: Object.fromEntries(Object.entries(OUTPUT_TOKENS).map(([k, n]) => [k, +cost(provider, rows, s, n).usd.toFixed(4)])) };
    // Claude with a 1-hour TTL: writes cost 2x ($8) instead of 1.25x, and entries survive turn gaps up to an hour.
    if (provider === 'claude' && s === 'warm') g.scenarios[s].usd_input_only_if_1h_ttl = +((tokens(sumS(s, 'fresh')) * PRICE.claude.input + tokens(sumS(s, 'write')) * 8 + tokens(sumS(s, 'read')) * PRICE.claude.read) / 1e6).toFixed(4);
    // Same token counts priced as Claude Sonnet 5.5 (skill list prices: $2 input, $2.50 5-minute write, $0.20 read, $10 output).
    if (provider === 'claude') { const S = { input: 2, write: 2.5, read: 0.2, output: 10 }, input = (tokens(sumS(s, 'fresh')) * S.input + tokens(sumS(s, 'write')) * S.write + tokens(sumS(s, 'read')) * S.read) / 1e6;
      g.scenarios[s].sonnet_5_5 = { usd_input_only: +input.toFixed(4), usd_total: Object.fromEntries(Object.entries(OUTPUT_TOKENS).map(([k, n]) => [k, +(input + rows.length * n * S.output / 1e6).toFixed(4)])) }; }
    if (provider === 'gpt') g.scenarios[s].usd_input_only_if_uncached_billed_as_write = +((tokens(sumS(s, 'fresh')) * PRICE.gpt.write + tokens(sumS(s, 'read')) * PRICE.gpt.read) / 1e6).toFixed(4);
  }
  g.per_round = rows.map(r => ({ round: r.round, turn: r.turn, tok: Math.round(tokens(r.total)), tools: Math.round(tokens(r.tools)), system: Math.round(tokens(r.system)), messages: Math.round(tokens(r.messages)),
    same_prefix_prev: Math.round(tokens(r.lcp_prev)), warm_read: Math.round(tokens(r.warm.read)), warm_write: Math.round(tokens(r.warm.write)) }));
  summary.games.push(g);
  console.log(JSON.stringify({ slug, provider, turns: g.turns, rounds: g.rounds, avg_round_tok: g.avg_round_tokens_est, input_tok: g.input_tokens_est,
    warm_read_share: g.scenarios.warm.cache_read_share, warm_usd_in: g.scenarios.warm.usd_input_only, cold_usd_in: g.scenarios.cold.usd_input_only, usd_total_mid_warm: g.scenarios.warm.usd_total.mid }));
}
if (outFile) await writeFile(outFile, JSON.stringify(summary, null, 1) + '\n');
