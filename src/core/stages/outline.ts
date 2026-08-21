import type { LLMProvider } from '../../providers/types.js';
import { SOUL_SYSTEM_PROMPT } from '../soul-prompt.js';
import type { AngleResult } from './angle.js';

export interface SectionBlueprint {
  heading: string;
  narrativeFlow: string;
  hasMermaid?: boolean;
  mermaidDescription?: string;
  hasCode?: boolean;
  codeDescription?: string;
}

export interface OutlineResult {
  title: string;
  narrativeArchetype: string;
  sections: SectionBlueprint[];
}

export async function generateOutline(
  angle: AngleResult,
  provider: LLMProvider,
): Promise<OutlineResult> {
  const prompt = `
다음 분석된 방향성을 바탕으로, 이 주제에 가장 완벽하게 어울리는 [목차 청사진]을 설계하세요.

[글 정보]
- 제목: ${angle.title}
- 핵심 쟁점: ${angle.targetAngle}
- 글의 성격: ${angle.narrativeArchetype}
- 서사 전략: ${angle.narrativeStrategy}
- 핵심 질문들:
${angle.keyQuestions.map((q, _i) => `  - ${q}`).join('\n')}

[자율적 설계 지침]
- 섹션 개수와 흐름은 이야기의 완결성과 전달력을 고려하여 당신이 가장 이상적이라고 생각하는 구조로 자유롭게 결정하세요.
- 다이어그램이나 코드 예제는 "독자의 이해를 돕는 데 실질적인 가치가 있는지"를 스스로 판단하여 필요한 위치에만 선택적으로 배치하세요 (불필요하면 넣지 않아도 무방합니다).
- 결론부 또한 정해진 형식 없이, 이 글의 맥락에 가장 잘 어울리는 방식(인사이트 요약, 배운 점, 다음 과제, 간결한 메시지 등)으로 마무리하도록 구성하세요.

반드시 아래 JSON 형식으로 응답하세요:

{
  "title": "${angle.title}",
  "narrativeArchetype": "${angle.narrativeArchetype}",
  "sections": [
    {
      "heading": "섹션 소제목",
      "narrativeFlow": "이 섹션에서 다룰 내용과 서사 흐름",
      "hasMermaid": false,
      "mermaidDescription": "다이어그램이 필요한 경우에만 설명 작성",
      "hasCode": false,
      "codeDescription": "코드 스니펫이 필요한 경우에만 설명 작성"
    }
  ]
}
`;

  const response = await provider.generate(prompt, {
    systemPrompt: SOUL_SYSTEM_PROMPT,
    temperature: 0.6,
  });

  try {
    const cleaned = response
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      title: parsed.title || angle.title,
      narrativeArchetype: parsed.narrativeArchetype || angle.narrativeArchetype,
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    };
  } catch {
    return {
      title: angle.title,
      narrativeArchetype: angle.narrativeArchetype,
      sections: [
        {
          heading: '도입: 문제의 발단과 배경',
          narrativeFlow: angle.coreProblem,
          hasMermaid: false,
        },
        {
          heading: '심층 분석: 내부 동작 메커니즘',
          narrativeFlow: angle.targetAngle,
          hasMermaid: true,
          mermaidDescription: '핵심 동작 시퀀스 흐름도',
          hasCode: true,
          codeDescription: '핵심 코드 스니펫',
        },
        {
          heading: '실무 인사이트 및 결론',
          narrativeFlow: '실무 적용 기준 및 결론',
          hasCode: false,
        },
      ],
    };
  }
}
