import type { z } from 'zod';
import { generateWithProvider } from '../providers/generate.js';
import type { GenerateOptions, LLMProvider } from '../providers/types.js';

function extractJson(response: string): unknown {
  const withoutFence = response
    .replace(/^```json\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');
  const candidate =
    start >= 0 && end >= start
      ? withoutFence.slice(start, end + 1)
      : withoutFence;
  return JSON.parse(candidate);
}

export async function generateStructured<T>(options: {
  provider: LLMProvider;
  prompt: string;
  generateOptions: GenerateOptions;
  promptContext?: string;
  schema: z.ZodType<T>;
  fallback: T;
  attempts?: number;
}): Promise<T> {
  const {
    provider,
    prompt,
    generateOptions,
    promptContext,
    schema,
    fallback,
    attempts = 2,
  } = options;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const retryInstruction =
      attempt === 1
        ? ''
        : '\n\n이전 응답의 JSON 구조가 요구사항과 일치하지 않았습니다. 설명 없이 유효한 JSON만 다시 출력하세요.';
    const response = await generateWithProvider(
      provider,
      `${prompt}${retryInstruction}`,
      {
        ...generateOptions,
        temperature: attempt === 1 ? generateOptions.temperature : 0.1,
      },
      promptContext,
    );

    try {
      const result = schema.safeParse(extractJson(response));
      if (result.success) {
        return result.data;
      }
    } catch {
      // 다음 시도에서 JSON-only 응답을 다시 요청한다.
    }
  }

  return fallback;
}
