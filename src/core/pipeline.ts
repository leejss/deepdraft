import type { LLMProvider } from '../providers/types.js';
import { logger } from '../utils/logger.js';
import type { OutputLanguage } from './language.js';
import { type AngleResult, extractAngle } from './stages/angle.js';
import { type AssemblyResult, assembleMarkdown } from './stages/assembly.js';
import { draftContent } from './stages/draft.js';
import { lintAndPolish } from './stages/lint.js';
import { generateOutline, type OutlineResult } from './stages/outline.js';
import {
  DEFAULT_LEVEL,
  type Level,
  type StageContext,
} from './stages/types.js';

export interface PipelineOptions {
  input: string;
  provider: LLMProvider;
  language: OutputLanguage;
  level?: Level;
  soulPrompt: string;
  debug?: boolean;
  onProgress?: (step: number, title: string, detail?: string) => void;
}

export interface PipelineResult {
  angle: AngleResult;
  outline: OutlineResult;
  markdown: string;
  frontmatter: AssemblyResult['frontmatter'];
}

export async function runPipeline(
  options: PipelineOptions,
): Promise<PipelineResult> {
  const {
    input,
    provider,
    language,
    level = DEFAULT_LEVEL,
    soulPrompt,
    debug = false,
    onProgress,
  } = options;
  const stageContext: StageContext = { language, level, soulPrompt };

  // Step 1: Analyze the topic and define the article direction
  onProgress?.(
    1,
    'Analyzing the topic and defining direction...',
    'Identifying the strongest narrative angle and story arc for this topic',
  );
  const angle = await extractAngle(input, provider, stageContext);
  if (debug) logger.log(angle);

  // Step 2: Design a tailored outline and article blueprint
  onProgress?.(
    2,
    'Building the article blueprint...',
    `"${angle.title}" — planning the section structure and key takeaways`,
  );
  const outline = await generateOutline(angle, provider, stageContext);
  if (debug) logger.log(outline);

  // Step 3: Draft the article section by section
  onProgress?.(
    3,
    'Drafting article sections...',
    `Writing ${outline.sections.length} tailored sections with diagrams and practical code`,
  );
  const draft = await draftContent(angle, outline, provider, stageContext);
  if (debug) logger.log(draft);

  // Step 4: Review technical accuracy, clarity, and completeness
  onProgress?.(
    4,
    'Reviewing technical accuracy and clarity...',
    'Checking unsupported claims, improving readability, and refining the article voice',
  );
  const polished = await lintAndPolish(draft, provider, stageContext);
  if (debug) logger.log(polished);

  // Step 5: Assemble the final Markdown and frontmatter
  onProgress?.(
    5,
    'Assembling Markdown and metadata...',
    'Generating YAML frontmatter and preparing the final article',
  );
  const assembly = await assembleMarkdown(
    angle,
    polished,
    provider,
    stageContext,
  );
  if (debug) logger.log(assembly);

  return {
    angle,
    outline,
    markdown: assembly.markdown,
    frontmatter: assembly.frontmatter,
  };
}
