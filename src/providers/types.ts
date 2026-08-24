export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  jsonSchema?: Record<string, unknown>;
}

export interface ApiGenerateOptions extends GenerateOptions {
  systemPrompt?: string;
}

export interface LocalAgentLLMProvider {
  readonly kind: 'local-agent';
  readonly id: string;
  readonly name: string;
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
}

export interface ApiLLMProvider {
  readonly kind: 'api';
  readonly id: string;
  readonly name: string;
  generate(prompt: string, options?: ApiGenerateOptions): Promise<string>;
}

export type LLMProvider = LocalAgentLLMProvider | ApiLLMProvider;
