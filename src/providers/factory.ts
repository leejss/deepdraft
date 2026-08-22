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

function requireEnvironment(name: string, alternatives: string[] = []): void {
  const names = [name, ...alternatives];
  if (!names.some((key) => process.env[key])) {
    throw new Error(
      `${name} 환경변수가 필요합니다.${
        alternatives.length > 0
          ? ` (대체 지원: ${alternatives.join(', ')})`
          : ''
      }`,
    );
  }
}

export async function createProvider(
  options: ProviderSelectionOptions,
): Promise<LLMProvider> {
  const { provider, model } = options;
  const normalized = provider.toLowerCase();

  if (!SUPPORTED_PROVIDERS.includes(normalized as SupportedProvider)) {
    throw new Error(
      `알 수 없는 Provider입니다: ${provider}. (지원 목록: ${SUPPORTED_PROVIDERS.join(', ')})`,
    );
  }

  if (normalized === 'codex' || normalized === 'agy') {
    if (!(await isCommandAvailable(normalized))) {
      throw new Error(
        `${normalized} CLI를 찾을 수 없습니다. 설치 상태를 확인해 주세요.`,
      );
    }
    return normalized === 'codex'
      ? new CodexProvider(model)
      : new AgyProvider(model);
  }

  if (normalized === 'openai') {
    requireEnvironment('OPENAI_API_KEY');
  } else if (normalized === 'gemini') {
    requireEnvironment('GEMINI_API_KEY', ['GOOGLE_GENERATIVE_AI_API_KEY']);
  } else {
    requireEnvironment('ANTHROPIC_API_KEY');
  }

  return new ApiProvider(normalized as ApiProviderType, model);
}
