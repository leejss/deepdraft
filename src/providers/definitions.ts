import { keysOf } from '../utils/values.js';

export const PROVIDER_DEFINITIONS = {
  codex: { kind: 'local', command: 'codex' },
  agy: { kind: 'local', command: 'agy' },
  openai: { kind: 'api', environmentVariable: 'OPENAI_API_KEY' },
  gemini: { kind: 'api', environmentVariable: 'GEMINI_API_KEY' },
  claude: { kind: 'api', environmentVariable: 'ANTHROPIC_API_KEY' },
} as const;

export type SupportedProvider = keyof typeof PROVIDER_DEFINITIONS;

type ProviderOfKind<
  Kind extends (typeof PROVIDER_DEFINITIONS)[SupportedProvider]['kind'],
> = {
  [Provider in SupportedProvider]: (typeof PROVIDER_DEFINITIONS)[Provider]['kind'] extends Kind
    ? Provider
    : never;
}[SupportedProvider];

export type LocalProviderType = ProviderOfKind<'local'>;
// "codex" | "agy"

export type ApiProviderType = ProviderOfKind<'api'>;
// "openai" | "gemini" | "claude"

export const SUPPORTED_PROVIDERS = keysOf(PROVIDER_DEFINITIONS);

export function isSupportedProvider(value: string): value is SupportedProvider {
  return Object.hasOwn(PROVIDER_DEFINITIONS, value);
}
