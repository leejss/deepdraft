import { execa } from 'execa';
import { AgyProvider } from './agy.provider.js';
import { ApiProvider } from './api.provider.js';
import { CodexProvider } from './codex.provider.js';
import {
  isSupportedProvider,
  PROVIDER_DEFINITIONS,
  SUPPORTED_PROVIDERS,
} from './definitions.js';
import type { LLMProvider } from './types.js';

export { SUPPORTED_PROVIDERS, type SupportedProvider } from './definitions.js';

export interface ProviderSelectionOptions {
  provider: string;
  model?: string;
}

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
  const normalized = provider.toLowerCase();
  if (!isSupportedProvider(normalized)) {
    throw new Error(
      `Unknown provider: ${provider}. Supported providers: ${SUPPORTED_PROVIDERS.join(', ')}.`,
    );
  }

  if (normalized === 'codex' || normalized === 'agy') {
    const { command } = PROVIDER_DEFINITIONS[normalized];
    if (!(await isCommandAvailable(command))) {
      throw new Error(
        `${command} CLI was not found. Please verify that it is installed and available on your PATH.`,
      );
    }

    return normalized === 'codex'
      ? new CodexProvider(model)
      : new AgyProvider(model);
  }

  requireEnvironment(PROVIDER_DEFINITIONS[normalized].environmentVariable);

  return new ApiProvider(normalized, model);
}
