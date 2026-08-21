import type { LLMProvider } from '../../providers/types.js';
import { SOUL_SYSTEM_PROMPT } from '../soul-prompt.js';
import type { AngleResult } from './angle.js';
import type { OutlineResult } from './outline.js';

export async function draftContent(
  angle: AngleResult,
  outline: OutlineResult,
  provider: LLMProvider,
): Promise<string> {
  const prompt = `
당신은 동료 엔지니어들이 즐겨 찾는 테크 블로그의 필진입니다.
다음 설계된 청사진을 바탕으로, **"몰입감 넘치고 깊이 있는 기술 블로그 본문 전체"**를 작성하세요.

[글 정보]
- 제목: ${outline.title}
- 글의 성격: ${outline.narrativeArchetype}
- 핵심 관점: ${angle.targetAngle}

[설계된 청사진(목차 및 서사 계획)]
${outline.sections
  .map(
    (s) => `
## ${s.heading}
- 서사 흐름: ${s.narrativeFlow}
${s.hasMermaid ? `- [다이어그램]: ${s.mermaidDescription}` : ''}
${s.hasCode ? `- [코드]: ${s.codeDescription}` : ''}
`,
  )
  .join('\n')}

[작성 가이드]
- 동료 엔지니어에게 흥미로운 기술적 통찰을 설명하듯 친절하고 명확하며 담백한 어조를 사용하세요.
- 첫 문장부터 독자의 호기심을 자극하거나 구체적인 문제 상황으로 자연스럽게 진입하세요.
- 설명에 필요한 다이어그램이나 코드는 독자의 이해를 돕는 데 집중하여 간결하고 명료하게 작성하세요.
- 결론부는 정해진 템플릿에 구애받지 않고, 이 글의 흐름과 여운에 가장 잘 맞는 자연스러운 마침표를 찍어주세요.

본문 마크다운 내용만 출력하세요 (Frontmatter는 제외하고 # 제목부터 시작).
`;

  const response = await provider.generate(prompt, {
    systemPrompt: SOUL_SYSTEM_PROMPT,
    temperature: 0.7,
    maxTokens: 8000,
  });

  return response.trim();
}
