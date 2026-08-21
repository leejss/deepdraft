import fs from 'node:fs/promises';
import path from 'node:path';

export async function readInputFile(filePath: string): Promise<string> {
  const resolved = path.resolve(process.cwd(), filePath);
  try {
    const content = await fs.readFile(resolved, 'utf-8');
    return content.trim();
  } catch (error: any) {
    throw new Error(
      `입력 파일을 읽을 수 없습니다 (${filePath}): ${error.message}`,
    );
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function saveMarkdownFile(
  content: string,
  outputPath?: string,
  fallbackTitle?: string,
): Promise<string> {
  let targetPath: string;

  if (outputPath) {
    targetPath = path.resolve(process.cwd(), outputPath);
  } else {
    const today = new Date().toISOString().split('T')[0];
    const slug = fallbackTitle ? slugify(fallbackTitle) : `post-${Date.now()}`;
    const postsDir = path.resolve(process.cwd(), 'posts');
    targetPath = path.join(postsDir, `${today}-${slug}.md`);
  }

  const dir = path.dirname(targetPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(targetPath, content, 'utf-8');

  return targetPath;
}
