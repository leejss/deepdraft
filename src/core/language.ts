import { keysOf } from '../utils/values.js';

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
