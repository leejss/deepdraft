import matter from 'gray-matter';
import type { LLMProvider } from '../../providers/types.js';
import { SOUL_SYSTEM_PROMPT } from '../soul-prompt.js';
import type { AngleResult } from './angle.js';

export interface FrontmatterData {
  title: string;
  description: string;
  date: string;
  tags: string[];
  category: string;
  readingTime: string;
}

export interface AssemblyResult {
  markdown: string;
  frontmatter: FrontmatterData;
}

function calculateReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
}

export async function assembleMarkdown(
  angle: AngleResult,
  polishedBody: string,
  provider: LLMProvider,
): Promise<AssemblyResult> {
  const today = new Date().toISOString().split('T')[0];
  const readingTime = calculateReadingTime(polishedBody);

  const prompt = `
다음 기술 블로그 본문을 분석하여 메타데이터(Frontmatter)를 생성하세요.

[제목]
${angle.title}

[본문 발췌 (앞부분 1000자)]
${polishedBody.slice(0, 1000)}

[요구사항]
- 5년차 개발자가 검색하거나 소셜에 공유되었을 때 클릭하고 싶을 만큼 명확하고 직관적인 설명(description)과 관련 태그(tags)를 도출하세요.
- 반드시 아래 JSON 형식으로만 응답하세요:

{
  "title": "${angle.title.replace(/"/g, '\\"')}",
  "description": "1~2문장의 핵심 기술 요약 및 이 글을 통해 얻을 수 있는 인사이트",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "category": "Backend"
}
`;

  let metadata: Partial<FrontmatterData> = {};
  try {
    const response = await provider.generate(prompt, {
      systemPrompt: SOUL_SYSTEM_PROMPT,
      temperature: 0.3,
    });
    const cleaned = response
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    metadata = JSON.parse(cleaned);
  } catch {
    metadata = {
      title: angle.title,
      description: `${angle.title}에 대한 심층 분석 및 실무 가이드`,
      tags: ['Engineering', 'Tech'],
      category: 'Engineering',
    };
  }

  const frontmatter: FrontmatterData = {
    title: metadata.title || angle.title,
    description: metadata.description || `${angle.title} 심층 분석`,
    date: today,
    tags: Array.isArray(metadata.tags) ? metadata.tags : ['Engineering'],
    category: metadata.category || 'Engineering',
    readingTime,
  };

  const finalMarkdown = matter.stringify(polishedBody, frontmatter);

  return {
    markdown: finalMarkdown,
    frontmatter,
  };
}
