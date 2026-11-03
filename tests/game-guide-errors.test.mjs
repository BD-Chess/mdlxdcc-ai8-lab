import test from 'node:test';
import assert from 'node:assert/strict';
import { gameGuideError } from '../public/assets/game-guide/errors.mjs';

test('a failed game-log start tells the player why the guide stopped (SL/EN)', () => {
  assert.match(gameGuideError('LOG_UNAVAILABLE'), /beleženje/);
  assert.match(gameGuideError('LOG_UNAVAILABLE', true), /logging/);
  assert.notEqual(gameGuideError('LOG_UNAVAILABLE'), gameGuideError('UNKNOWN_CODE'));
});

test('event logging: a game that cannot load is GAME_UNAVAILABLE, a log failure is LOG_UNAVAILABLE', async () => {
  const { makeHandler } = await import('../functions/game-guide.mjs');
  let FIRST = 's1';
  const post = h => h(new Request('https://www.mdlxdcc.org/.netlify/functions/game-guide', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug: '_fixture', message: 'UI event', operation: 'event', development: true, client_actions: [{ name: 'open_step', id: FIRST }], protocol: 'game-guide-tools-v1' }) }));
  const base = { accessFactory: async () => ({ role: 'owner', id: 'fixture' }), configured: { claude: true, gpt: true }, continuationSecret: () => 'offline-fixture-only-'.repeat(4), clientFactory: async () => ({}), budgetFactory: () => ({}) };
  const { readFile } = await import('node:fs/promises');
  const game = JSON.parse(await readFile(new URL('../public/game/_fixture/game.json', import.meta.url), 'utf8'));
  const noGame = await post(makeHandler({ ...base, gameFactory: async () => { throw Error('GAME_UNAVAILABLE'); }, logStore: { start: async () => null } }));
  assert.equal(noGame.status, 503); assert.equal((await noGame.json()).error.code, 'GAME_UNAVAILABLE');
  FIRST = game.steps[0].id;
  const noLog = await post(makeHandler({ ...base, gameFactory: async () => structuredClone(game), logStore: { start: async () => { throw Error('slug check'); } } }));
  assert.equal(noLog.status, 503); assert.equal((await noLog.json()).error.code, 'LOG_UNAVAILABLE');
});
