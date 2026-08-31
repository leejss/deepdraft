import fs from 'node:fs/promises';
import path from 'node:path';

const defaultSoulFile = new URL('../../soul.md', import.meta.url);

export async function loadSoulPrompt(soulPath?: string): Promise<string> {
  const customPath = soulPath?.trim();

  if (soulPath !== undefined && !customPath) {
    throw new Error('Soul 파일 경로가 비어 있습니다.');
  }

  const target = customPath
    ? path.resolve(process.cwd(), customPath)
    : defaultSoulFile;
  const label = customPath ?? 'soul.md';

  let content: string;
  try {
    content = await fs.readFile(target, 'utf-8');
  } catch (error: any) {
    throw new Error(
      `Soul 파일을 읽을 수 없습니다 (${label}): ${error.message}`,
    );
  }

  const prompt = content.trim();
  if (!prompt) {
    throw new Error(`Soul 파일이 비어 있습니다 (${label}).`);
  }

  return prompt;
}
