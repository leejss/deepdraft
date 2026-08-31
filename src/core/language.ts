import { keysOf } from '../utils/values.js';
import type { Level } from './stages/types.js';

export const LANGUAGE_DEFINITIONS = {
  ko: { name: 'Korean' },
  en: { name: 'English' },
} as const;

export type OutputLanguage = keyof typeof LANGUAGE_DEFINITIONS;

export const SUPPORTED_LANGUAGES = keysOf(LANGUAGE_DEFINITIONS);

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

export function createPromptContext(
  language: OutputLanguage,
  soulPrompt: string,
  level: Level = 'intermediate',
): string {
  const languageName = LANGUAGE_DEFINITIONS[language].name;
  const languageInstruction = [
    'Output language policy:',
    `- Write all reader-facing prose in ${languageName}.`,
    `- Calibrate explanations, terminology, and code detail for ${level}-level readers.`,
    '- Preserve code, commands, URLs, identifiers, product names, and verbatim quotations.',
    '- Keep JSON property names and YAML frontmatter keys exactly as specified.',
    '- Keep the selected output language unchanged throughout planning, drafting, revision, and metadata generation.',
  ].join('\n');

  return `${soulPrompt.trim()}\n\n${languageInstruction}`;
}
