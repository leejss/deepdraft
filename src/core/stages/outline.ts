import { z } from 'zod';
import { generateStructured } from '../../providers/structured.js';
import type { LLMProvider } from '../../providers/types.js';
import type { AngleResult } from './angle.js';
import { createPromptContext } from './context.js';
import type { StageContext } from './types.js';

export interface SectionBlueprint {
  heading: string;
  tldr: string;
  narrativeFlow: string;
}

export interface OutlineResult {
  title: string;
  sections: SectionBlueprint[];
}

const sectionSchema = z.object({
  heading: z.string().trim().min(1),
  tldr: z.string(),
  narrativeFlow: z.string(),
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
        required: ['heading', 'tldr', 'narrativeFlow'],
        properties: {
          heading: { type: 'string', minLength: 1 },
          tldr: { type: 'string' },
          narrativeFlow: { type: 'string' },
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
- Core problem: ${angle.coreProblem}
- Core perspective: ${angle.targetAngle}
- Key questions:
${angle.keyQuestions.map((q, _i) => `  - ${q}`).join('\n')}

[Design guidance]
- Build a coherent argument that addresses the core problem through the chosen perspective.
- Use the key questions to determine coverage, but organize sections by narrative logic rather than one section per question.
- Choose the number and order of sections based on what is necessary to make the argument complete and clear.
- Give each section one concise takeaway and describe how it advances the article's overall narrative.

Respond with JSON matching this shape:

{
  "title": "${angle.title}",
  "sections": [
    {
      "heading": "Section heading",
      "tldr": "The section's central takeaway",
      "narrativeFlow": "How the section develops the argument and connects to the surrounding sections"
    }
  ]
}
`;

  return generateStructured({
    provider,
    prompt,
    promptContext: createPromptContext(context),
    generateOptions: {
      temperature: 0.6,
      jsonSchema: outlineJsonSchema,
    },
    schema: outlineSchema,
  });
}
