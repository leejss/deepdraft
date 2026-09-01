export interface GenerateOptions {
  jsonSchema?: Record<string, unknown>;
}

export interface LLMProvider {
  readonly id: string;
  readonly name: string;
  generate(prompt: string, options?: GenerateOptions): Promise<string>;
}
