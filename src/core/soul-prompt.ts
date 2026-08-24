import fs from 'node:fs/promises';

const soulFile = new URL('../../soul.md', import.meta.url);

export const SOUL_PROMPT_CONTEXT = await fs.readFile(soulFile, 'utf-8');
