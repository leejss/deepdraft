import type { GenerateOptions, LLMProvider } from './types.js';

export function generateWithProvider(
  provider: LLMProvider,
  prompt: string,
  options: GenerateOptions,
  promptContext?: string,
): Promise<string> {
  if (provider.kind === 'api') {
    return provider.generate(prompt, {
      ...options,
      systemPrompt: promptContext,
    });
  }

  const fullPrompt = promptContext ? `${promptContext}\n\n${prompt}` : prompt;
  return provider.generate(fullPrompt, options);
}
