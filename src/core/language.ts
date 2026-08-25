import { keysOf } from '../utils/values.js';
import { SOUL_PROMPT_CONTEXT } from './soul-prompt.js';

export const LANGUAGE_DEFINITIONS = {
  ko: { name: 'Korean' },
  en: { name: 'English' },
} as const;

export type OutputLanguage = keyof typeof LANGUAGE_DEFINITIONS;

export const SUPPORTED_LANGUAGES = keysOf(LANGUAGE_DEFINITIONS);

export interface StageOptions {
  language: OutputLanguage;
}

function isOutputLanguage(value: string): value is OutputLanguage {
  return Object.hasOwn(LANGUAGE_DEFINITIONS, value);
}

export function parseOutputLanguage(value: string): OutputLanguage {
  if (isOutputLanguage(value)) {
    return value;
  }

  throw new Error(
    `Unsupported language: ${value}. Supported languages: ${SUPPORTED_LANGUAGES.join(', ')}`,
  );
}

export function createPromptContext(language: OutputLanguage): string {
  const languageName = LANGUAGE_DEFINITIONS[language].name;
  const languageInstruction = [
    'Output language policy:',
    `- Write all reader-facing prose in ${languageName}.`,
    '- Preserve code, commands, URLs, identifiers, product names, and verbatim quotations.',
    '- Keep JSON property names and YAML frontmatter keys exactly as specified.',
    '- Keep the selected output language unchanged throughout planning, drafting, revision, and metadata generation.',
  ].join('\n');

  return `${SOUL_PROMPT_CONTEXT.trim()}\n\n${languageInstruction}`;
}
