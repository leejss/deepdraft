import { keysOf } from '../utils/values.js';

export const AGENT_DEFINITIONS = {
  codex: { command: 'codex' },
  agy: { command: 'agy' },
  claude: { command: 'claude' },
  opencode: { command: 'opencode' },
} as const;

export const API_PROVIDER_DEFINITIONS = {
  openai: { environmentVariable: 'OPENAI_API_KEY' },
  gemini: { environmentVariable: 'GEMINI_API_KEY' },
  claude: { environmentVariable: 'ANTHROPIC_API_KEY' },
} as const;

export type SupportedAgent = keyof typeof AGENT_DEFINITIONS;
export type ApiProviderType = keyof typeof API_PROVIDER_DEFINITIONS;

export const SUPPORTED_AGENTS = keysOf(AGENT_DEFINITIONS);
export const SUPPORTED_PROVIDERS = keysOf(API_PROVIDER_DEFINITIONS);

export function isSupportedAgent(value: string): value is SupportedAgent {
  return Object.hasOwn(AGENT_DEFINITIONS, value);
}

export function isSupportedApiProvider(
  value: string,
): value is ApiProviderType {
  return Object.hasOwn(API_PROVIDER_DEFINITIONS, value);
}
