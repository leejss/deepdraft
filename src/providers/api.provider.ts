import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { generateText, type LanguageModel } from 'ai';
import type { ApiProviderType } from './definitions.js';
import type { ApiGenerateOptions, ApiLLMProvider } from './types.js';

export type { ApiProviderType } from './definitions.js';

const DEFAULT_MODELS: Record<ApiProviderType, string> = {
  gemini: 'gemini-3.7-flash',
  openai: 'gpt-5.6',
  claude: 'claude-opus-5',
};

function supportsTemperature(type: ApiProviderType, modelName: string): boolean {
  if (type === 'gemini' && modelName.startsWith('gemini-3')) {
    return false;
  }

  if (
    type === 'claude' &&
    ['claude-fable-5', 'claude-opus-5', 'claude-sonnet-5'].some((prefix) =>
      modelName.startsWith(prefix),
    )
  ) {
    return false;
  }

  return true;
}

export class ApiProvider implements ApiLLMProvider {
  public readonly kind = 'api' as const;
  public readonly id: string;
  public readonly name: string;
  private readonly modelInstance: LanguageModel;
  private readonly temperatureSupported: boolean;

  constructor(type: ApiProviderType, modelName?: string) {
    this.id = type;
    const resolvedModelName = modelName || DEFAULT_MODELS[type];
    this.temperatureSupported = supportsTemperature(type, resolvedModelName);

    switch (type) {
      case 'gemini':
        this.name = `Google Gemini (${resolvedModelName})`;
        this.modelInstance = google(resolvedModelName);
        break;
      case 'openai':
        this.name = `OpenAI (${resolvedModelName})`;
        this.modelInstance = openai(resolvedModelName);
        break;
      case 'claude':
        this.name = `Anthropic Claude (${resolvedModelName})`;
        this.modelInstance = anthropic(resolvedModelName);
        break;
      default:
        throw new Error(`지원하지 않는 API Provider입니다: ${type}`);
    }
  }

  async generate(
    prompt: string,
    options?: ApiGenerateOptions,
  ): Promise<string> {
    const result = await generateText({
      model: this.modelInstance,
      system: options?.systemPrompt,
      prompt,
      temperature: this.temperatureSupported
        ? (options?.temperature ?? 0.7)
        : undefined,
      maxTokens: options?.maxTokens,
    });

    return result.text.trim();
  }
}
