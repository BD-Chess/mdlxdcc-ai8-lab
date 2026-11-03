import { providerEnv, providerRound } from '../mdlxdcc-guide/provider.mjs';

// R4 cost: Claude receives the system prompt as text blocks with cache_control breakpoints
// (systemBlocks); GPT and injected test rounds receive the same text as one string (system).
// The shared transport itself is unchanged.
export const gameProviderRound = ({ systemBlocks, ...args }) =>
  providerRound(args.provider === 'claude' && Array.isArray(systemBlocks) ? { ...args, system: systemBlocks } : args);

// Game-only configuration; the shared Guide/Andaluzija transport is unchanged.
export function gameProviderKey(provider) {
  const name = provider === 'claude' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';
  const dedicated = providerEnv('GAME_GUIDE_' + name);
  return { apiKey: dedicated || providerEnv(name), key_source: dedicated ? 'dedicated' : 'shared' };
}
export function gameProviderModel(provider) {
  return provider === 'claude' ? providerEnv('GAME_GUIDE_CLAUDE_MODEL') || 'claude-opus-5-5'
    : providerEnv('GAME_GUIDE_GPT_MODEL') || 'gpt-6.1-sol';
}
export async function createGameProviderClient(provider, { Anthropic, OpenAI } = {}) {
  const options = { apiKey: gameProviderKey(provider).apiKey, maxRetries: 0, timeout: 45000 };
  if (provider === 'claude') {
    const Client = Anthropic ?? (await import('@anthropic-ai/sdk')).default;
    return new Client(options);
  }
  const Client = OpenAI ?? (await import('openai')).default;
  return new Client(options);
}
