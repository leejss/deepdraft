import type { LLMProvider } from '../../providers/types.js';
import { SOUL_SYSTEM_PROMPT } from '../soul-prompt.js';

export interface AngleResult {
  title: string;
  coreProblem: string;
  targetAngle: string;
  narrativeArchetype: string;
  narrativeStrategy: string;
  keyQuestions: string[];
}

export async function extractAngle(
  input: string,
  provider: LLMProvider,
  style?: string,
): Promise<AngleResult> {
  const prompt = `
다음 입력(주제 또는 메모)을 검토하고, 동료 엔지니어들이 가장 흥미롭게 읽을 수 있는 [글의 방향성과 서사 전략]을 당신의 판단으로 자유롭게 설계하세요.

[입력 내용]
${input}
${style ? `[참고 스타일 요청]: ${style}` : ''}

반드시 아래 JSON 형식으로 응답하세요:

{
  "title": "명확하고 매력적인 기술 블로그 제목",
  "coreProblem": "이 글이 다루는 핵심 문제 또는 기술적 쟁점",
  "targetAngle": "5년차 엔지니어가 공감할 깊이 있는 기술적 시각",
  "narrativeArchetype": "주제에 가장 자연스러운 글의 성격 (예: 트러블슈팅 회고, 런타임 딥다이브, 아키텍처 비교, 성능 개선 여정, 기술 에세이 등)",
  "narrativeStrategy": "독자를 몰입시키기 위한 이 글만의 자연스러운 이야기 전개 방식",
  "keyQuestions": [
    "글에서 다룰 핵심 질문들"
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
      title: parsed.title || '기술 아티클',
      coreProblem: parsed.coreProblem || '',
      targetAngle: parsed.targetAngle || '',
      narrativeArchetype: parsed.narrativeArchetype || '심층 분석',
      narrativeStrategy:
        parsed.narrativeStrategy || '자연스러운 기술 탐구 서사',
      keyQuestions: Array.isArray(parsed.keyQuestions)
        ? parsed.keyQuestions
        : [],
    };
  } catch {
    return {
      title: input.slice(0, 50),
      coreProblem: input,
      targetAngle: '심층 기술 분석',
      narrativeArchetype: '심층 분석',
      narrativeStrategy: '문제 정의 및 내부 메커니즘 분석',
      keyQuestions: ['왜 이런 현상이 발생하는가?'],
    };
  }
}
