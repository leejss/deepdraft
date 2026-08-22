import { parseOutputLanguage } from '../core/language.js';
import { runPipeline } from '../core/pipeline.js';
import { createProvider } from '../providers/factory.js';
import type { LLMProvider } from '../providers/types.js';
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
        ? `${rawInput}\n\n[참고 메모/자료]\n${fileContent}`
        : fileContent;
    }

    if (!rawInput) {
      throw new Error(
        '작성할 주제를 입력하거나 --file 옵션으로 입력 파일을 지정해 주세요.\n' +
          '예시: deepdraft write "PostgreSQL MVCC 동작 원리" --provider codex --language ko',
      );
    }

    const provider = await createProvider({
      provider: options.provider,
      model: options.model,
    });

    logger.info(`사용 중인 Provider: ${provider.name}`);
    let providerCallCount = 0;
    const trackedProvider: LLMProvider = {
      id: provider.id,
      name: provider.name,
      generate: async (prompt, generateOptions) => {
        providerCallCount += 1;
        return provider.generate(prompt, generateOptions);
      },
    };

    const result = await runPipeline({
      input: rawInput,
      provider: trackedProvider,
      style: options.style,
      language: parseOutputLanguage(options.language),
      onProgress: (step, title, detail) => {
        if (currentStep > 0 && currentStep < step) {
          logger.succeedStep(`Step ${currentStep} 완료`);
        }
        currentStep = step;
        logger.startStep(step, 5, title);
        if (detail) {
          logger.updateDetail(detail);
        }
      },
    });

    logger.succeedStep('Step 5 완료 (마크다운 조립 완료)');

    const savedPath = await saveMarkdownFile(result.markdown, {
      outputPath: options.output,
      fallbackTitle: result.frontmatter.title || result.angle.title,
      force: options.force,
    });

    logger.box('기술 블로그 글 생성 완료!', {
      '제목 (Title)': result.frontmatter.title,
      카테고리: result.frontmatter.category,
      '태그 (Tags)': result.frontmatter.tags.join(', '),
      '예상 읽기시간': result.frontmatter.readingTime,
      'Provider 호출': `${providerCallCount}회`,
      '저장 경로': savedPath,
    });

    logger.success(`성공적으로 생성되었습니다: ${savedPath}`);
  } catch (error: any) {
    if (currentStep > 0) {
      logger.failStep('생성 실패');
    }
    throw error;
  }
}
