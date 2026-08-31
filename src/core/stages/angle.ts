import { z } from 'zod';
import { generateStructured } from '../../providers/structured.js';
import type { LLMProvider } from '../../providers/types.js';
import { createPromptContext } from './context.js';
import type { StageContext } from './types.js';

export interface AngleResult {
  title: string;
  coreProblem: string;
  targetAngle: string;
  keyQuestions: string[];
}

const angleSchema = z.object({
  title: z.string().trim().min(1),
  coreProblem: z.string(),
  targetAngle: z.string(),
  keyQuestions: z.array(z.string()),
});

const angleJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'coreProblem', 'targetAngle', 'keyQuestions'],
  properties: {
    title: { type: 'string', minLength: 1 },
    coreProblem: { type: 'string' },
    targetAngle: { type: 'string' },
    keyQuestions: { type: 'array', items: { type: 'string' } },
  },
};

export async function extractAngle(
  input: string,
  provider: LLMProvider,
  context: StageContext,
): Promise<AngleResult> {
  const prompt = `
Review the following topic or notes and design the most appropriate direction and narrative strategy for a technical article.

[Input]
${input}

Respond with JSON matching this shape:

{
  "title": "A clear and compelling article title",
  "coreProblem": "The central problem or technical question",
  "targetAngle": "The perspective and depth appropriate for the audience defined by the system instructions",
  "keyQuestions": [
    "The key questions the article should answer"
  ]
}
`;

  return generateStructured({
    provider,
    prompt,
    promptContext: createPromptContext(context),
    generateOptions: {
      temperature: 0.6,
      jsonSchema: angleJsonSchema,
    },
    schema: angleSchema,
  });
}
