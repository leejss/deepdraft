import { generateWithProvider } from '../../providers/generate.js';
import type { LLMProvider } from '../../providers/types.js';
import type { AngleResult } from './angle.js';
import { createPromptContext } from './context.js';
import type { OutlineResult } from './outline.js';
import type { StageContext } from './types.js';

export async function draftContent(
  angle: AngleResult,
  outline: OutlineResult,
  provider: LLMProvider,
  context: StageContext,
): Promise<string> {
  const prompt = `
Write a complete, engaging, and technically substantial article from the blueprint below.

[Article]
- Title: ${outline.title}
- Core perspective: ${angle.targetAngle}

[Blueprint]
${outline.sections
  .map(
    (s) => `
## ${s.heading}
- Key takeaway: ${s.tldr}
- Narrative purpose: ${s.narrativeFlow}
`,
  )
  .join('\n')}

[Writing guidance]
- Use a clear, direct, and professional peer-to-peer voice.
- Open with a concrete problem, observation, or question rather than generic background.
- Use diagrams or code only where they materially improve understanding.
- End in a way that fits the article instead of applying a fixed conclusion template.

Return only the Markdown article body, beginning with the level-one title. Do not include frontmatter.
`;

  const response = await generateWithProvider(
    provider,
    prompt,
    {
      temperature: 0.7,
      maxTokens: 8000,
    },
    createPromptContext(context),
  );

  return response.trim();
}
