import { LANGUAGE_DEFINITIONS } from '../language.js';
import type { StageContext } from './types.js';

export function createPromptContext(context: StageContext): string {
  const languageName = LANGUAGE_DEFINITIONS[context.language].name;
  const languageInstruction = [
    'Output language policy:',
    `- Write all reader-facing prose in ${languageName}.`,
    `- Calibrate explanations, terminology, and code detail for ${context.level}-level readers.`,
    '- Preserve code, commands, URLs, identifiers, product names, and verbatim quotations.',
    '- Keep JSON property names and YAML frontmatter keys exactly as specified.',
    '- Keep the selected output language unchanged throughout planning, drafting, revision, and metadata generation.',
  ].join('\n');

  return `${context.soulPrompt.trim()}\n\n${languageInstruction}`;
}
