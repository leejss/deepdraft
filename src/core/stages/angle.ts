import { z } from 'zod';
import type { LLMProvider } from '../../providers/types.js';
import { generateStructured } from '../../utils/structured.js';
import { createPromptContext, type StageOptions } from '../language.js';

export interface AngleResult {
  title: string;
  coreProblem: string;
  targetAngle: string;
  narrativeArchetype: string;
  narrativeStrategy: string;
  keyQuestions: string[];
}

const angleSchema = z.object({
  title: z.string().trim().min(1),
  coreProblem: z.string(),
  targetAngle: z.string(),
  narrativeArchetype: z.string().trim().min(1),
  narrativeStrategy: z.string(),
  keyQuestions: z.array(z.string()),
});

const angleJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'title',
    'coreProblem',
    'targetAngle',
    'narrativeArchetype',
    'narrativeStrategy',
    'keyQuestions',
  ],
  properties: {
    title: { type: 'string', minLength: 1 },
    coreProblem: { type: 'string' },
    targetAngle: { type: 'string' },
    narrativeArchetype: { type: 'string', minLength: 1 },
    narrativeStrategy: { type: 'string' },
    keyQuestions: { type: 'array', items: { type: 'string' } },
  },
};

export async function extractAngle(
  input: string,
  provider: LLMProvider,
  options: StageOptions,
  style?: string,
): Promise<AngleResult> {
  const prompt = `
Review the following topic or notes and design the most appropriate direction and narrative strategy for a technical article.

[Input]
${input}
${style ? `[Requested style]: ${style}` : ''}

Respond with JSON matching this shape:

{
  "title": "A clear and compelling article title",
  "coreProblem": "The central problem or technical question",
  "targetAngle": "The perspective and depth appropriate for the audience defined by the system instructions",
  "narrativeArchetype": "The form that best fits the topic, such as an incident retrospective, runtime deep dive, architecture comparison, optimization journey, or technical essay",
  "narrativeStrategy": "A narrative strategy tailored to this article",
  "keyQuestions": [
    "The key questions the article should answer"
  ]
}
`;

  const fallback =
    options.language === 'ko'
      ? {
          title: input.slice(0, 50),
          coreProblem: input,
          targetAngle: '심층 기술 분석',
          narrativeArchetype: '심층 분석',
          narrativeStrategy: '문제 정의 및 내부 메커니즘 분석',
          keyQuestions: ['왜 이런 현상이 발생하는가?'],
        }
      : {
          title: input.slice(0, 50),
          coreProblem: input,
          targetAngle: 'In-depth technical analysis',
          narrativeArchetype: 'Deep analysis',
          narrativeStrategy:
            'Define the problem and examine its internal mechanisms',
          keyQuestions: ['Why does this behavior occur?'],
        };

  return generateStructured({
    provider,
    prompt,
    promptContext: createPromptContext(options.language),
    generateOptions: {
      temperature: 0.6,
      jsonSchema: angleJsonSchema,
    },
    schema: angleSchema,
    fallback,
  });
}
