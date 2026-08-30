import { execa } from 'execa';
import { AgyProvider } from './agy.provider.js';
import { ApiProvider } from './api.provider.js';
import { ClaudeProvider } from './claude.provider.js';
import { CodexProvider } from './codex.provider.js';
import {
  isSupportedAgent,
  isSupportedApiProvider,
  SUPPORTED_AGENTS,
  SUPPORTED_AGENTS_LIST,
  SUPPORTED_API_PROVIDERS,
  SUPPORTED_PROVIDERS_LIST,
} from './definitions.js';
import { OpenCodeProvider } from './opencode.provider.js';
import type { LLMProvider } from './types.js';

export {
  type ApiProviderType,
  SUPPORTED_AGENTS_LIST,
  SUPPORTED_PROVIDERS_LIST,
  type SupportedAgent,
} from './definitions.js';

export interface ProviderSelectionOptions {
  agent?: string;
  provider?: string;
  model?: string;
}

async function isCommandAvailable(command: string): Promise<boolean> {
  try {
    const locator = process.platform === 'win32' ? 'where' : 'which';
    await execa(locator, [command]);
    return true;
  } catch {
    return false;
  }
}

function assertEnv(name: string): void {
  if (!process.env[name]) {
    throw new Error(`${name} environment variable is required.`);
  }
}

export async function createProvider(
  options: ProviderSelectionOptions,
): Promise<LLMProvider> {
  const agent = options.agent?.trim();
  const provider = options.provider?.trim();

  if (agent && provider) {
    throw new Error('--agent와 --provider는 동시에 사용할 수 없습니다.');
  }

  if (!agent && !provider) {
    throw new Error('--agent 또는 --provider 중 하나를 지정해야 합니다.');
  }

  if (agent) {
    const normalized = agent.toLowerCase();
    if (!isSupportedAgent(normalized)) {
      throw new Error(
        `Unknown agent: ${agent}. Supported agents: ${SUPPORTED_AGENTS_LIST.join(', ')}.`,
      );
    }

    const { command } = SUPPORTED_AGENTS[normalized];
    if (!(await isCommandAvailable(command))) {
      throw new Error(
        `${command} CLI was not found. Please verify that it is installed and available on your PATH.`,
      );
    }

    switch (normalized) {
      case 'codex':
        return new CodexProvider(options.model);
      case 'agy':
        return new AgyProvider(options.model);
      case 'claude':
        return new ClaudeProvider(options.model);
      case 'opencode':
        return new OpenCodeProvider(options.model);
    }
  }

  if (!provider) {
    throw new Error('--agent 또는 --provider 중 하나를 지정해야 합니다.');
  }

  const normalized = provider.toLowerCase();
  if (!isSupportedApiProvider(normalized)) {
    throw new Error(
      `Unknown provider: ${provider}. Supported providers: ${SUPPORTED_PROVIDERS_LIST.join(', ')}.`,
    );
  }

  assertEnv(SUPPORTED_API_PROVIDERS[normalized].environmentVariable);
  return new ApiProvider(normalized, options.model);
}
