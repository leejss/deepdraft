import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { generateText, type LanguageModel } from 'ai';
import type { ApiProviderType } from './definitions.js';
import type { ApiGenerateOptions, ApiLLMProvider } from './types.js';

export type { ApiProviderType } from './definitions.js';

export class ApiProvider implements ApiLLMProvider {
  public readonly kind = 'api' as const;
  public readonly id: string;
  public readonly name: string;
  private readonly modelInstance: LanguageModel;

  constructor(type: ApiProviderType, modelName?: string) {
    this.id = type;
    switch (type) {
      case 'gemini':
        this.name = `Google Gemini (${modelName || 'gemini-2.0-flash'})`;
        this.modelInstance = google(modelName || 'gemini-2.0-flash');
        break;
      case 'openai':
        this.name = `OpenAI (${modelName || 'gpt-4o'})`;
        this.modelInstance = openai(modelName || 'gpt-4o');
        break;
      case 'claude':
        this.name = `Anthropic Claude (${modelName || 'claude-3-5-sonnet-latest'})`;
        this.modelInstance = anthropic(modelName || 'claude-3-5-sonnet-latest');
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
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens,
    });

    return result.text.trim();
  }
}
