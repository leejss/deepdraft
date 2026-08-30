import { keysOf } from '../utils/values.js';

export const SUPPORTED_AGENTS = {
  codex: { command: 'codex' },
  agy: { command: 'agy' },
  claude: { command: 'claude' },
  opencode: { command: 'opencode' },
} as const;

export const SUPPORTED_API_PROVIDERS = {
  openai: { environmentVariable: 'OPENAI_API_KEY' },
  gemini: { environmentVariable: 'GEMINI_API_KEY' },
  claude: { environmentVariable: 'ANTHROPIC_API_KEY' },
} as const;

export type SupportedAgent = keyof typeof SUPPORTED_AGENTS;
export type ApiProviderType = keyof typeof SUPPORTED_API_PROVIDERS;

export const SUPPORTED_AGENTS_LIST = keysOf(SUPPORTED_AGENTS);
export const SUPPORTED_PROVIDERS_LIST = keysOf(SUPPORTED_API_PROVIDERS);

export function isSupportedAgent(value: string): value is SupportedAgent {
  return Object.hasOwn(SUPPORTED_AGENTS, value);
}

export function isSupportedApiProvider(
  value: string,
): value is ApiProviderType {
  return Object.hasOwn(SUPPORTED_API_PROVIDERS, value);
}
