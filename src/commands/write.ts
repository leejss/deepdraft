import { parseOutputLanguage } from '../core/language.js';
import { runPipeline } from '../core/pipeline.js';
import { createProvider } from '../providers/factory.js';
import { readInputFile, saveMarkdownFile } from '../utils/file.js';
import { logger } from '../utils/logger.js';

export interface WriteCommandOptions {
  file?: string;
  output?: string;
  provider: string;
  model?: string;
  style?: string;
  language: string;
  force?: boolean;
}

export async function handleWrite(
  topicArg: string | undefined,
  options: WriteCommandOptions,
): Promise<void> {
  let currentStep = 0;

  try {
    let rawInput = topicArg?.trim();
    if (options.file) {
      const fileContent = await readInputFile(options.file);
      rawInput = rawInput
        ? `${rawInput}\n\n[Reference notes]\n${fileContent}`
        : fileContent;
    }

    if (!rawInput) {
      throw new Error(
        'Provide a topic or specify an input file with the --file option.\n' +
          'Example: deepdraft write "How PostgreSQL MVCC Works" --provider codex --language en',
      );
    }

    const provider = await createProvider({
      provider: options.provider,
      model: options.model,
    });

    logger.info(`Using provider: ${provider.name}`);

    const result = await runPipeline({
      input: rawInput,
      provider,
      style: options.style,
      language: parseOutputLanguage(options.language),
      onProgress: (step, title, detail) => {
        if (currentStep > 0 && currentStep < step) {
          logger.succeedStep(`Step ${currentStep} complete`);
        }
        currentStep = step;
        logger.startStep(step, 5, title);
        if (detail) {
          logger.updateDetail(detail);
        }
      },
    });

    logger.succeedStep('Step 5 complete (Markdown assembled)');

    const savedPath = await saveMarkdownFile(result.markdown, {
      outputPath: options.output,
      fallbackTitle: result.frontmatter.title || result.angle.title,
      force: options.force,
    });

    logger.box('Your technical article is ready!', {
      Title: result.frontmatter.title,
      Category: result.frontmatter.category,
      Tags: result.frontmatter.tags.join(', '),
      'Estimated reading time': result.frontmatter.readingTime,
      'Output path': savedPath,
    });

    logger.success(`Article saved successfully: ${savedPath}`);
  } catch (error: any) {
    if (currentStep > 0) {
      logger.failStep('Article generation failed');
    }
    throw error;
  }
}
