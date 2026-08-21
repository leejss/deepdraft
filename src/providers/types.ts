export interface GenerateOptions {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  jsonSchema?: Record<string, unknown>;
}

export interface LLMProvider {
  readonly id: string;
  readonly name: string;
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
}
