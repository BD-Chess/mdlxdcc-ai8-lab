// R4 cost: lock the cacheable prompt layout. Offline only: the real handler and the real shared
// transport run against a fake provider client; no network, keys or model calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { makeHandler } from '../functions/game-guide.mjs';
import { createSession, validateBody, modelContext, instructions, promptParts, systemPrompt, CONTEXT_MARKER } from '../functions/lib/game-guide/runtime.mjs';
import { stepTexts } from '../functions/lib/game-guide/content.mjs';

const game = stepTexts(await readFile(new URL('../public/game/dayton1903/index.html', import.meta.url), 'utf8'), JSON.parse(await readFile(new URL('../public/game/dayton1903/game.json', import.meta.url), 'utf8')));
const step = id => game.steps.find(s => s.id === id);
const text = system => Array.isArray(system) ? system.map(b => b.text).join('') : system;
const context = system => JSON.parse(text(system).split(CONTEXT_MARKER)[1]);
const results = items => items.flatMap(m => m.type === 'function_call_output' ? [JSON.parse(m.output)] : Array.isArray(m.content) ? m.content.filter(c => c.type === 'tool_result').map(c => JSON.parse(c.content)) : []);

// Deterministic agent: open the next step, a hint on request, one question, then assess and reveal.
function agent(payload) {
  const ctx = context(payload.system ?? payload.instructions), items = payload.messages ?? payload.input;
  const at = items.findLastIndex(m => m.role === 'user' && typeof m.content === 'string' && m.content.startsWith('{"message"'));
  const message = JSON.parse(items[at].content).message, done = results(items.slice(at + 1)), last = done.at(-1), allowed = ctx.allowed_open_steps;
  const call = (name, args) => ({ calls: [{ name, args }] });
  if (done.some(r => r.visible) || last?.wait_for_player) return { text: 'Preberi na desni.' };
  if (last?.card_prepared) return call('open_step', { id: allowed.find(s => s.kind === 'reveal').id });
  if (/namig/i.test(message)) return call('open_step', { id: allowed.find(s => s.kind === 'hint').id });
  if (/^Moja/.test(message)) return call('ask_understanding', { step: 's2', idea: step('s2').key_ideas[1], question: 'Kaj se zgodi na drugi strani?' });
  if (/^Razlaga/.test(message)) return call('assess_challenge', { step: 's2', achieved: step('s2').key_ideas, path: 'historical', why: 'Mehanizem je razložen.', advantages: [] });
  return call('open_step', { id: allowed.find(s => s.kind !== 'hint').id });
}
function fakeClient(provider, payloads) {
  let n = 0;
  if (provider === 'claude') return { messages: { stream(payload) {
    payloads.push(structuredClone(payload)); const out = agent(payload);
    const content = [...(out.text ? [{ type: 'text', text: out.text }] : []), ...(out.calls || []).map(c => ({ type: 'tool_use', id: `toolu_${++n}`, name: c.name, input: c.args }))];
    return { async *[Symbol.asyncIterator]() { if (out.text) yield { type: 'content_block_delta', delta: { type: 'text_delta', text: out.text } }; },
      finalMessage: async () => ({ content, stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 } }) };
  } } };
  return { responses: { async create(payload) {
    payloads.push(structuredClone(payload)); const out = agent(payload);
    const output = [...(out.text ? [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: out.text }] }] : []),
      ...(out.calls || []).map(c => ({ type: 'function_call', call_id: `call_${++n}`, name: c.name, arguments: JSON.stringify(c.args) }))];
    return (async function* () { if (out.text) yield { type: 'response.output_text.delta', delta: out.text }; yield { type: 'response.completed', response: { output, status: 'completed', usage: { input_tokens: 1, output_tokens: 1 } } }; })();
  } } };
}
async function play(provider) {
  const payloads = [];
  const handler = makeHandler({ accessFactory: async () => ({ role: 'owner', id: 'offline-cost-r4' }), configured: { claude: true, gpt: true },
    continuationSecret: () => 'offline-cost-r4-secret-only-'.repeat(3), gameFactory: async () => structuredClone(game),
    clientFactory: async () => fakeClient(provider, payloads), budgetFactory: () => ({ reserve: async () => null, settle: async () => {} }), logStore: { start: async () => null } });
  let opened = ['s1'], learning = { asked: [], cards: {} }; const history = [];
  for (const message of ['Začniva.', 'Namig, prosim.', 'Moja zamisel: kot krila.', 'Razlaga: vzgon, kot, nasprotno, žice.', 'Naprej.']) {
    let body = { slug: 'dayton1903', provider, mode: 'IZUMLJAJ', protocol: 'game-guide-tools-v1', message, opened: [...opened], learning, history: history.slice(-12) }, reply = '';
    for (let hop = 0; hop < 4; hop++) {
      const response = await handler(new Request('https://www.mdlxdcc.org/.netlify/functions/game-guide', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }));
      assert.equal(response.status, 200);
      const events = (await response.text()).split('\n\n').filter(Boolean).map(f => JSON.parse(f.slice(6)));
      assert.ok(!events.some(e => e.type === 'error'), JSON.stringify(events));
      for (const e of events) { if (e.type === 'action' && !opened.includes(e.id)) opened.push(e.id); if (e.type === 'state') learning = e.learning; if (e.type === 'delta') reply += e.text; }
      const token = events.find(e => e.type === 'continue')?.token; if (!token) break;
      body = { continuation: token, receipts: events.filter(e => e.type === 'action').map(a => ({ call_id: a.call_id, name: a.name, opened: a.id, ok: true, visible: true, already_open: false })) };
    }
    history.push({ role: 'user', content: message }, { role: 'assistant', content: reply });
  }
  assert.deepEqual(opened, ['s1', 's2', 's3', 's6', 's7']); assert.equal(learning.cards.s2.card, 'A');
  return payloads;
}
const runs = { claude: await play('claude'), gpt: await play('gpt') };

test('R4 Claude: one stable cached prefix per game, append-only opened steps, uncached turn state last', () => {
  const rounds = runs.claude; assert.ok(rounds.length >= 8);
  for (const p of rounds) {
    assert.ok(Array.isArray(p.system) && p.system.every(b => b.type === 'text' && b.text.length > 0));
    const marks = [...p.tools, ...p.system, ...p.messages.flatMap(m => Array.isArray(m.content) ? m.content : [])].filter(b => b.cache_control);
    assert.equal(marks.length, 3); assert.ok(marks.every(b => b.cache_control.type === 'ephemeral'));
    assert.ok(p.system[0].cache_control && !p.system[1].cache_control && !p.system.at(-1).cache_control);
    assert.ok(p.system.at(-2).cache_control && p.system.at(-3).cache_control);
    // The prompt is the same text the model saw before R4, one JSON context equal to modelContext's keys.
    const ctx = context(p.system); assert.ok(ctx.opened.length && 'sealed_key' in ctx && ctx.learning && ctx.allowed_open_steps);
  }
  // Rules and game header: byte-identical in every round of the game.
  assert.equal(new Set(rounds.map(p => p.system[0].text)).size, 1);
  assert.equal(new Set(rounds.map(p => p.system[1].text)).size, 1);
  assert.equal(new Set(rounds.map(p => JSON.stringify(p.tools))).size, 1);
  // Opened steps only grow at the end, so the previous breakpoint stays a readable prefix.
  const steps = p => p.system.slice(2, -2).map(b => b.text);
  for (let i = 1; i < rounds.length; i++) assert.deepEqual(steps(rounds[i]).slice(0, steps(rounds[i - 1]).length), steps(rounds[i - 1]));
  // Nothing per turn in the stable prefix: no player text, no transitions, no sealed hint/reveal text.
  const stable = rounds[0].system[0].text + rounds[0].system[1].text;
  for (const secret of ['Moja zamisel', '"allowed_open_steps":', '"challenge_answers":', '"learning":', '"sealed_key":', step('s3').text, step('s6').text, step('s2').key_ideas[0]]) assert.ok(!stable.includes(secret), secret);
  // ESTIMATE (4 characters per token, conservative for English): above Claude's 512-token cache minimum.
  assert.ok(rounds[0].system[0].text.length / 4 >= 512);
});

test('R4 GPT: same text as Claude, stable instruction prefix and append-only context for automatic prefix caching', () => {
  const gpt = runs.gpt, claude = runs.claude; assert.equal(gpt.length, claude.length);
  gpt.forEach((p, i) => { assert.equal(typeof p.instructions, 'string'); assert.equal(p.instructions, text(claude[i].system)); });
  const rules = claude[0].system[0].text + claude[0].system[1].text;
  assert.ok(gpt.every(p => p.instructions.startsWith(rules)));
  // ESTIMATE (4 characters per token): the identical prefix exceeds OpenAI's 1024-token caching minimum.
  assert.ok(claude[0].system[0].text.length / 4 >= 1024);
  const openedPrefix = (p, i) => p.instructions.slice(0, p.instructions.length - claude[i].system.at(-1).text.length - claude[i].system.at(-2).text.length);
  for (let i = 1; i < gpt.length; i++) assert.ok(gpt[i].instructions.startsWith(openedPrefix(gpt[i - 1], i - 1)), `round ${i + 1}`);
});

test('R4 prompt parts: the context is exactly modelContext(); frozen cards move to the cached part only after their reveal', () => {
  const card = { card: 'A', line: 'Kartica A · zgodovinska pot', achieved: [], independent: [], score: 5 };
  const states = [[['s1'], {}], [['s1', 's2'], {}], [['s1', 's2', 's3'], { s2: card }], [['s1', 's2', 's3', 's6'], { s2: card }], [['s1', 's2', 's3', 's6', 's7', 's8'], { s2: card, s8: card }]];
  for (const [opened, cards] of states) {
    const s = createSession(game, validateBody({ slug: 'dayton1903', message: 'Naprej.', opened, learning: { asked: ['s2'], cards } }));
    const parts = promptParts(game, s.snapshot(), s), full = instructions(game, s.snapshot(), s);
    assert.equal(parts.map(p => p.text).join(''), full); assert.equal(systemPrompt('gpt', game, s.snapshot(), s), full);
    assert.deepEqual(JSON.parse(full.split(CONTEXT_MARKER)[1]), JSON.parse(JSON.stringify(modelContext(game, s))));
    const cached = parts.filter(p => p.cache).map(p => p.text).join(''), turn = parts.at(-1).text;
    // s2's reveal is s6; s8's reveal is never open in these states.
    assert.equal(cached.includes('"s2":{"card"'), opened.includes('s6'));
    assert.equal(turn.includes('"s2":{"card"'), Boolean(cards.s2) && !opened.includes('s6'));
    assert.ok(!cached.includes('"s8":{"card"')); assert.equal(turn.includes('"s8":{"card"'), Boolean(cards.s8));
  }
  // Player-facing wording stays Slovenian while the instructions are English.
  const prompt = instructions(game, validateBody({ slug: 'dayton1903', message: 'x' }));
  assert.match(prompt, /Everything the player sees is in Slovenian/); assert.match(prompt, /»Kartica B · tvoja pot · drugače, a deluje · 5\/5«/);
});
