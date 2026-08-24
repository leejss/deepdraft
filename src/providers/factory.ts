import { execa } from 'execa';
import { AgyProvider } from './agy.provider.js';
import { ApiProvider, type ApiProviderType } from './api.provider.js';
import { CodexProvider } from './codex.provider.js';
import type { LLMProvider } from './types.js';

export interface ProviderSelectionOptions {
  provider: string;
  model?: string;
}

export const SUPPORTED_PROVIDERS = [
  'codex',
  'agy',
  'openai',
  'gemini',
  'claude',
] as const;

export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

export async function isCommandAvailable(command: string): Promise<boolean> {
  try {
    const locator = process.platform === 'win32' ? 'where' : 'which';
    await execa(locator, [command]);
    return true;
  } catch {
    return false;
  }
}

function requireEnvironment(name: string): void {
  if (!process.env[name]) {
    throw new Error(`${name} environment variable is required.`);
  }
}

export async function createProvider(
  options: ProviderSelectionOptions,
): Promise<LLMProvider> {
  const { provider, model } = options;
  const normalized = provider.toLowerCase() as SupportedProvider;
  if (!SUPPORTED_PROVIDERS.includes(normalized)) {
    throw new Error(
      `Unknown provider: ${provider}. Supported providers: ${SUPPORTED_PROVIDERS.join(', ')}.`,
    );
  }

  if (normalized === 'codex' || normalized === 'agy') {
    if (!(await isCommandAvailable(normalized))) {
      throw new Error(
        `${normalized} CLI was not found. Please verify that it is installed and available on your PATH.`,
      );
    }

    return normalized === 'codex'
      ? new CodexProvider(model)
      : new AgyProvider(model);
  }

  if (normalized === 'openai') {
    requireEnvironment('OPENAI_API_KEY');
  } else if (normalized === 'gemini') {
    requireEnvironment('GEMINI_API_KEY');
  } else {
    requireEnvironment('ANTHROPIC_API_KEY');
  }

  return new ApiProvider(normalized as ApiProviderType, model);
}
