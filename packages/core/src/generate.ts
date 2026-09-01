import type { GenerateOptions, LLMProvider } from './provider.js';

export function generateWithProvider(
  provider: LLMProvider,
  prompt: string,
  options: GenerateOptions,
  promptContext?: string,
): Promise<string> {
  const fullPrompt = promptContext ? `${promptContext}\n\n${prompt}` : prompt;
  return provider.generate(fullPrompt, options);
}
