import fs from 'node:fs/promises';
import path from 'node:path';
import { formatLocalDate } from './date.js';

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

export interface SaveMarkdownOptions {
  outputPath?: string;
  fallbackTitle?: string;
  force?: boolean;
}

export async function saveMarkdownFile(
  content: string,
  options: SaveMarkdownOptions = {},
): Promise<string> {
  const { outputPath, fallbackTitle, force = false } = options;
  let targetPath: string;

  if (outputPath) {
    targetPath = path.resolve(process.cwd(), outputPath);
  } else {
    const today = formatLocalDate();
    const generatedSlug = fallbackTitle ? slugify(fallbackTitle) : '';
    const slug = generatedSlug || `post-${Date.now()}`;
    const postsDir = path.resolve(process.cwd(), 'posts');
    targetPath = path.join(postsDir, `${today}-${slug}.md`);
  }

  const dir = path.dirname(targetPath);
  await fs.mkdir(dir, { recursive: true });

  if (force) {
    await fs.writeFile(targetPath, content, 'utf-8');
    return targetPath;
  }

  if (outputPath) {
    try {
      await fs.writeFile(targetPath, content, {
        encoding: 'utf-8',
        flag: 'wx',
      });
      return targetPath;
    } catch (error: any) {
      if (error?.code === 'EEXIST') {
        throw new Error(
          `출력 파일이 이미 존재합니다: ${targetPath}\n덮어쓰려면 --force 옵션을 사용해 주세요.`,
        );
      }
      throw error;
    }
  }

  const extension = path.extname(targetPath);
  const basePath = targetPath.slice(0, -extension.length);
  for (let sequence = 1; sequence <= 999; sequence += 1) {
    const candidate =
      sequence === 1 ? targetPath : `${basePath}-${sequence}${extension}`;
    try {
      await fs.writeFile(candidate, content, {
        encoding: 'utf-8',
        flag: 'wx',
      });
      return candidate;
    } catch (error: any) {
      if (error?.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  throw new Error('사용 가능한 출력 파일 이름을 만들 수 없습니다.');
}
