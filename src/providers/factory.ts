import { execa } from 'execa';
import { AgyProvider } from './agy.provider.js';
import { ApiProvider, type ApiProviderType } from './api.provider.js';
import { CodexProvider } from './codex.provider.js';
import type { LLMProvider } from './types.js';

export interface ProviderSelectionOptions {
  provider?: string;
  model?: string;
}

async function isCommandAvailable(command: string): Promise<boolean> {
  try {
    await execa('which', [command]);
    return true;
  } catch {
    return false;
  }
}

export async function resolveProvider(
  options: ProviderSelectionOptions = {},
): Promise<LLMProvider> {
  const { provider, model } = options;

  // 1. 사용자가 명시적으로 provider를 지정한 경우
  if (provider) {
    const normalized = provider.toLowerCase();
    if (['gemini', 'openai', 'claude'].includes(normalized)) {
      return new ApiProvider(normalized as ApiProviderType, model);
    }
    if (normalized === 'agy') {
      return new AgyProvider(model);
    }
    if (normalized === 'codex') {
      return new CodexProvider(model);
    }
    throw new Error(
      `알 수 없는 프로바이더입니다: ${provider}. (지원 목록: gemini, openai, claude, agy, codex)`,
    );
  }

  // 2. 환경변수에 API Key가 있는지 확인
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new ApiProvider('gemini', model);
  }
  if (process.env.OPENAI_API_KEY) {
    return new ApiProvider('openai', model);
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return new ApiProvider('claude', model);
  }

  // 3. 로컬 에이전트 CLI(agy, codex)가 설치되어 있는지 자동 감지
  if (await isCommandAvailable('agy')) {
    return new AgyProvider(model);
  }
  if (await isCommandAvailable('codex')) {
    return new CodexProvider(model);
  }

  throw new Error(
    '사용 가능한 LLM Provider를 찾을 수 없습니다.\n' +
      '다음 중 하나를 설정해 주세요:\n' +
      '  - API Key 환경변수 설정 (GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY)\n' +
      '  - 로컬 코딩 에이전트 CLI 설치 (agy, codex)\n' +
      '  - --provider 플래그 지정 (예: --provider agy)',
  );
}
