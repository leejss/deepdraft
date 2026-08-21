import type { LLMProvider } from '../../providers/types.js';
import { SOUL_SYSTEM_PROMPT } from '../soul-prompt.js';

export async function lintAndPolish(
  draft: string,
  provider: LLMProvider,
): Promise<string> {
  const prompt = `
다음 작성된 기술 블로그 초안을 테크 에디터의 시각에서 [글의 가독성과 완성도 퇴고]하여 최종본을 출력하세요.

[초안 내용]
${draft}

[퇴고 가이드]
- 문맥이 매끄럽고 어조가 자연스러운지 확인하고, 지나치게 딱딱하거나 상투적인 표현이 있다면 자연스럽게 다듬으세요.
- 마크다운 문법(코드 블록 하이라이팅, 다이어그램 문법 등)이 올바른지 점검하세요.
- 글의 결론이 본문의 이야기 흐름과 잘 어우러지며 깔끔하게 맺어지는지 확인하세요.

교정된 최종 마크다운 본문만 출력하세요.
`;

  const response = await provider.generate(prompt, {
    systemPrompt: SOUL_SYSTEM_PROMPT,
    temperature: 0.4,
    maxTokens: 8000,
  });

  return response.trim();
}
