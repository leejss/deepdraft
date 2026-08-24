import { z } from 'zod';
import type { LLMProvider } from '../../providers/types.js';
import { generateStructured } from '../../utils/structured.js';
import { createPromptContext, type StageOptions } from '../language.js';
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

const sectionSchema = z.object({
  heading: z.string().trim().min(1),
  narrativeFlow: z.string(),
  hasMermaid: z.boolean(),
  mermaidDescription: z.string(),
  hasCode: z.boolean(),
  codeDescription: z.string(),
});

const outlineSchema = z.object({
  title: z.string().trim().min(1),
  narrativeArchetype: z.string().trim().min(1),
  sections: z.array(sectionSchema).min(1),
});

const outlineJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'narrativeArchetype', 'sections'],
  properties: {
    title: { type: 'string', minLength: 1 },
    narrativeArchetype: { type: 'string', minLength: 1 },
    sections: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'heading',
          'narrativeFlow',
          'hasMermaid',
          'mermaidDescription',
          'hasCode',
          'codeDescription',
        ],
        properties: {
          heading: { type: 'string', minLength: 1 },
          narrativeFlow: { type: 'string' },
          hasMermaid: { type: 'boolean' },
          mermaidDescription: { type: 'string' },
          hasCode: { type: 'boolean' },
          codeDescription: { type: 'string' },
        },
      },
    },
  },
};

export async function generateOutline(
  angle: AngleResult,
  provider: LLMProvider,
  options: StageOptions,
): Promise<OutlineResult> {
  const prompt = `
Design an article blueprint that best fits the analyzed direction below.

[Article]
- Title: ${angle.title}
- Core perspective: ${angle.targetAngle}
- Narrative archetype: ${angle.narrativeArchetype}
- Narrative strategy: ${angle.narrativeStrategy}
- Key questions:
${angle.keyQuestions.map((q, _i) => `  - ${q}`).join('\n')}

[Design guidance]
- Choose the number and order of sections based on narrative completeness and clarity.
- Include diagrams or code only where they materially improve understanding.
- Design a conclusion that fits this article rather than applying a fixed template.

Respond with JSON matching this shape:

{
  "title": "${angle.title}",
  "narrativeArchetype": "${angle.narrativeArchetype}",
  "sections": [
    {
      "heading": "Section heading",
      "narrativeFlow": "The content and narrative purpose of this section",
      "hasMermaid": false,
      "mermaidDescription": "Describe the diagram only when needed",
      "hasCode": false,
      "codeDescription": "Describe the code example only when needed"
    }
  ]
}
`;

  const fallbackSections =
    options.language === 'ko'
      ? [
          {
            heading: '도입: 문제의 발단과 배경',
            narrativeFlow: angle.coreProblem,
            hasMermaid: false,
            mermaidDescription: '',
            hasCode: false,
            codeDescription: '',
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
            hasMermaid: false,
            mermaidDescription: '',
            hasCode: false,
            codeDescription: '',
          },
        ]
      : [
          {
            heading: 'Introduction: Problem and context',
            narrativeFlow: angle.coreProblem,
            hasMermaid: false,
            mermaidDescription: '',
            hasCode: false,
            codeDescription: '',
          },
          {
            heading: 'Deep dive: Internal mechanisms',
            narrativeFlow: angle.targetAngle,
            hasMermaid: true,
            mermaidDescription: 'Sequence of the core mechanism',
            hasCode: true,
            codeDescription: 'Focused implementation example',
          },
          {
            heading: 'Practical implications and conclusion',
            narrativeFlow:
              'Decision criteria, practical guidance, and conclusion',
            hasMermaid: false,
            mermaidDescription: '',
            hasCode: false,
            codeDescription: '',
          },
        ];

  return generateStructured({
    provider,
    prompt,
    promptContext: createPromptContext(options.language),
    generateOptions: {
      temperature: 0.6,
      jsonSchema: outlineJsonSchema,
    },
    schema: outlineSchema,
    fallback: {
      title: angle.title,
      narrativeArchetype: angle.narrativeArchetype,
      sections: fallbackSections,
    },
  });
}
