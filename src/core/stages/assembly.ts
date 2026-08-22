import matter from 'gray-matter';
import { z } from 'zod';
import type { LLMProvider } from '../../providers/types.js';
import { formatLocalDate } from '../../utils/date.js';
import { generateStructured } from '../../utils/structured.js';
import { createSystemPrompt, type StageOptions } from '../language.js';
import type { AngleResult } from './angle.js';

export interface FrontmatterData {
  title: string;
  description: string;
  date: string;
  tags: string[];
  category: string;
  readingTime: string;
}

export interface AssemblyResult {
  markdown: string;
  frontmatter: FrontmatterData;
}

const metadataSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)).min(1),
  category: z.string().trim().min(1),
});

const metadataJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'description', 'tags', 'category'],
  properties: {
    title: { type: 'string', minLength: 1 },
    description: { type: 'string', minLength: 1 },
    tags: {
      type: 'array',
      minItems: 1,
      items: { type: 'string', minLength: 1 },
    },
    category: { type: 'string', minLength: 1 },
  },
};

function calculateReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min`;
}

export async function assembleMarkdown(
  angle: AngleResult,
  polishedBody: string,
  provider: LLMProvider,
  options: StageOptions,
): Promise<AssemblyResult> {
  const today = formatLocalDate();
  const readingTime = calculateReadingTime(polishedBody);

  const prompt = `
Analyze the following technical article and generate its frontmatter metadata.

[Title]
${angle.title}

[Article excerpt: first 1,000 characters]
${polishedBody.slice(0, 1000)}

[Requirements]
- Write a clear description that helps the intended audience understand the article's value and scope from a search result or shared link.
- Preserve established product and technology names in tags.
- Respond only with JSON matching this shape:

{
  "title": "${angle.title.replace(/"/g, '\\"')}",
  "description": "A one- or two-sentence technical summary and the insight the reader will gain",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "category": "Backend"
}
`;

  const fallbackDescription =
    options.language === 'ko'
      ? `${angle.title}에 대한 심층 분석 및 실무 가이드`
      : `An in-depth analysis and practical guide to ${angle.title}`;

  const metadata = await generateStructured({
    provider,
    prompt,
    generateOptions: {
      systemPrompt: createSystemPrompt(options.language),
      temperature: 0.3,
      jsonSchema: metadataJsonSchema,
    },
    schema: metadataSchema,
    fallback: {
      title: angle.title,
      description: fallbackDescription,
      tags: ['Engineering', 'Tech'],
      category: 'Engineering',
    },
  });

  const frontmatter: FrontmatterData = {
    title: metadata.title,
    description: metadata.description,
    date: today,
    tags: metadata.tags,
    category: metadata.category,
    readingTime,
  };

  const finalMarkdown = matter.stringify(polishedBody, frontmatter);

  return {
    markdown: finalMarkdown,
    frontmatter,
  };
}
