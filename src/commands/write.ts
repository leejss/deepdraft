import { parseOutputLanguage } from '../core/language.js';
import { runPipeline } from '../core/pipeline.js';
import { createProvider } from '../providers/factory.js';
import { readInputFile, saveMarkdownFile } from '../utils/file.js';
import { logger } from '../utils/logger.js';

export interface WriteCommandOptions {
  output?: string;
  agent?: string;
  provider?: string;
  model?: string;
  style?: string;
  language: string;
  force?: boolean;
}

export type WriteInput =
  | {
      kind: 'topic';
      value: string;
    }
  | {
      kind: 'file';
      path: string;
    };

export function resolveWriteInput(
  topicArg: string | undefined,
  filePath: string | undefined,
): WriteInput {
  const topic = topicArg?.trim();
  const file = filePath?.trim();

  if (topic && file) {
    throw new Error('topic과 --file은 동시에 사용할 수 없습니다.');
  }

  if (topic) {
    return { kind: 'topic', value: topic };
  }

  if (file) {
    return { kind: 'file', path: file };
  }

  throw new Error(
    'Provide a topic or specify an input file with the --file option.\n' +
      'Example: deepdraft write "How PostgreSQL MVCC Works" --agent codex --language en',
  );
}

export async function handleWrite(
  input: WriteInput,
  options: WriteCommandOptions,
): Promise<void> {
  try {
    const rawInput =
      input.kind === 'topic' ? input.value : await readInputFile(input.path);

    if (!rawInput) {
      throw new Error('The input file is empty.');
    }

    const provider = await createProvider({
      agent: options.agent,
      provider: options.provider,
      model: options.model,
    });

    logger.info(`Using backend: ${provider.name}`);

    const result = await runPipeline({
      input: rawInput,
      provider,
      style: options.style,
      language: parseOutputLanguage(options.language),
      onProgress: (step, title, detail) => {
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
    logger.failStep('Article generation failed');
    throw error;
  }
}
