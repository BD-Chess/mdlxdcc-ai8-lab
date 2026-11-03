import test from 'node:test';
import assert from 'node:assert/strict';
import { gameGuideError } from '../public/assets/game-guide/errors.mjs';

test('a failed game-log start tells the player why the guide stopped (SL/EN)', () => {
  assert.match(gameGuideError('LOG_UNAVAILABLE'), /beleženje/);
  assert.match(gameGuideError('LOG_UNAVAILABLE', true), /logging/);
  assert.notEqual(gameGuideError('LOG_UNAVAILABLE'), gameGuideError('UNKNOWN_CODE'));
});
