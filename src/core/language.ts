import { SOUL_PROMPT_CONTEXT } from './soul-prompt.js';

export const SUPPORTED_LANGUAGES = ['ko', 'en'] as const;

export type OutputLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export interface StageOptions {
  language: OutputLanguage;
}

export function parseOutputLanguage(value: string): OutputLanguage {
  if (SUPPORTED_LANGUAGES.includes(value as OutputLanguage)) {
    return value as OutputLanguage;
  }

  throw new Error(
    `Unsupported language: ${value}. Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`,
  );
}

export function createPromptContext(language: OutputLanguage): string {
  const languageName = language === 'ko' ? 'Korean' : 'English';
  const languageInstruction = [
    'Output language policy:',
    `- Write all reader-facing prose in ${languageName}.`,
    '- Preserve code, commands, URLs, identifiers, product names, and verbatim quotations.',
    '- Keep JSON property names and YAML frontmatter keys exactly as specified.',
    '- Keep the selected output language unchanged throughout planning, drafting, revision, and metadata generation.',
  ].join('\n');

  return `${SOUL_PROMPT_CONTEXT.trim()}\n\n${languageInstruction}`;
}
