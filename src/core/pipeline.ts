import type { LLMProvider } from '../providers/types.js';
import { type AngleResult, extractAngle } from './stages/angle.js';
import { type AssemblyResult, assembleMarkdown } from './stages/assembly.js';
import { draftContent } from './stages/draft.js';
import { lintAndPolish } from './stages/lint.js';
import { generateOutline, type OutlineResult } from './stages/outline.js';

export interface PipelineOptions {
  input: string;
  provider: LLMProvider;
  style?: string;
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
  const { input, provider, style, onProgress } = options;

  // Step 1: 의도 분석 및 동적 서사 장르 결정
  onProgress?.(
    1,
    '장르 및 서사 전략 도출 중...',
    '주제에 최적화된 글의 장르(Archetype)와 스토리라인 분석',
  );
  const angle = await extractAngle(input, provider, style);

  // Step 2: 맞춤형 목차 및 청사진 동적 설계
  onProgress?.(
    2,
    `청사진 설계 중... [장르: ${angle.narrativeArchetype}]`,
    `"${angle.title}" - 최적화된 섹션 구조 및 핵심 요소 배치 계획`,
  );
  const outline = await generateOutline(angle, provider);

  // Step 3: 섹션별 심층 본문 작성
  onProgress?.(
    3,
    '섹션별 심층 본문 작성 중...',
    `총 ${outline.sections.length}개 맞춤형 섹션, 다이어그램 및 실무 코드 작성`,
  );
  const draft = await draftContent(angle, outline, provider);

  // Step 4: 가독성 및 완성도 퇴고
  onProgress?.(
    4,
    '가독성 및 완성도 퇴고 중...',
    'soul.md 가치 기준에 맞춘 자연스러운 블로그 톤 교정',
  );
  const polished = await lintAndPolish(draft, provider);

  // Step 5: 표준 마크다운 및 Frontmatter 조립
  onProgress?.(
    5,
    '표준 마크다운 및 메타데이터 조립 중...',
    'YAML Frontmatter 생성 및 최종 파일 완성',
  );
  const assembly = await assembleMarkdown(angle, polished, provider);

  return {
    angle,
    outline,
    markdown: assembly.markdown,
    frontmatter: assembly.frontmatter,
  };
}
