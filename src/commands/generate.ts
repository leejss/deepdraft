import { runPipeline } from '../core/pipeline.js';
import { resolveProvider } from '../providers/factory.js';
import { readInputFile, saveMarkdownFile } from '../utils/file.js';
import { logger } from '../utils/logger.js';

export interface GenerateCommandOptions {
  file?: string;
  output?: string;
  provider?: string;
  model?: string;
  style?: string;
}

export async function handleGenerate(
  topicArg: string | undefined,
  options: GenerateCommandOptions,
): Promise<void> {
  try {
    // 1. 입력 확인 (주제 문자열 또는 파일)
    let rawInput = topicArg?.trim();
    if (options.file) {
      const fileContent = await readInputFile(options.file);
      rawInput = rawInput
        ? `${rawInput}\n\n[참고 메모/자료]\n${fileContent}`
        : fileContent;
    }

    if (!rawInput) {
      logger.error(
        '생성할 주제를 인자로 입력하거나 --file 옵션으로 파일을 지정해 주세요.',
      );
      logger.info('예시: tech-blog generate "PostgreSQL MVCC 동작 원리"');
      logger.info('예시: tech-blog generate --file ./notes.txt');
      process.exit(1);
    }

    // 2. LLM Provider 확인 및 연결
    const provider = await resolveProvider({
      provider: options.provider,
      model: options.model,
    });

    logger.info(`사용 중인 Provider: ${provider.name}`);

    // 3. 5단계 파이프라인 실행
    let currentStep = 0;
    const result = await runPipeline({
      input: rawInput,
      provider,
      style: options.style,
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

    // 4. 마크다운 파일 저장
    const savedPath = await saveMarkdownFile(
      result.markdown,
      options.output,
      result.frontmatter.title || result.angle.title,
    );

    // 5. 완료 결과 요약 출력
    logger.box('기술 블로그 글 생성 완료!', {
      '제목 (Title)': result.frontmatter.title,
      카테고리: result.frontmatter.category,
      '태그 (Tags)': result.frontmatter.tags.join(', '),
      '예상 읽기시간': result.frontmatter.readingTime,
      '저장 경로': savedPath,
    });

    logger.success(`성공적으로 생성되었습니다: ${savedPath}`);
  } catch (error: any) {
    logger.failStep('생성 실패');
    logger.error(error.message || String(error));
    process.exit(1);
  }
}
