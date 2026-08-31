import { z } from 'zod';
import { generateStructured } from '../../providers/structured.js';
import type { LLMProvider } from '../../providers/types.js';
import { createPromptContext } from '../language.js';
import type { AngleResult } from './angle.js';
import type { StageContext } from './types.js';

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
  sections: z.array(sectionSchema).min(1),
});

const outlineJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'sections'],
  properties: {
    title: { type: 'string', minLength: 1 },
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
  context: StageContext,
): Promise<OutlineResult> {
  const prompt = `
Design an article blueprint that best fits the analyzed direction below.

[Article]
- Title: ${angle.title}
- Core perspective: ${angle.targetAngle}
- Key questions:
${angle.keyQuestions.map((q, _i) => `  - ${q}`).join('\n')}

[Design guidance]
- Choose the number and order of sections based on narrative completeness and clarity.
- Include diagrams or code only where they materially improve understanding.
- Design a conclusion that fits this article rather than applying a fixed template.

Respond with JSON matching this shape:

{
  "title": "${angle.title}",
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

  return generateStructured({
    provider,
    prompt,
    promptContext: createPromptContext(
      context.language,
      context.soulPrompt,
      context.level,
    ),
    generateOptions: {
      temperature: 0.6,
      jsonSchema: outlineJsonSchema,
    },
    schema: outlineSchema,
  });
}
