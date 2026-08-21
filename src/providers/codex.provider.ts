import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execa } from 'execa';
import type { GenerateOptions, LLMProvider } from './types.js';

export class CodexProvider implements LLMProvider {
  public readonly id = 'codex';
  public readonly name = 'Codex CLI (Local Agent)';

  constructor(private readonly modelName?: string) {}

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const fullPrompt = options?.systemPrompt
      ? `Instructions:\n${options.systemPrompt}\n\nTask:\n${prompt}\n\n중요: 필요한 최소한의 검증을 신속히 완료한 후, 요구된 마크다운 결과물을 즉시 출력하세요.`
      : prompt;

    const tempOutputFile = path.join(
      os.tmpdir(),
      `codex_output_${Date.now()}_${Math.random().toString(36).slice(2)}.txt`,
    );

    const args = [
      'exec',
      '--dangerously-bypass-approvals-and-sandbox',
      '--ephemeral',
      '-o',
      tempOutputFile,
    ];

    if (this.modelName) {
      args.push('-m', this.modelName);
    }
    args.push(fullPrompt);

    try {
      await execa('codex', args, {
        input: '', // stdin 입력 대기 방지
        timeout: 600000, // 심층 리서치 및 장문 생성을 위한 10분 타임아웃
      });

      const result = await fs.readFile(tempOutputFile, 'utf-8');
      await fs.unlink(tempOutputFile).catch(() => {});
      return result.trim();
    } catch (error: any) {
      await fs.unlink(tempOutputFile).catch(() => {});
      throw new Error(
        `codex CLI 실행 중 오류가 발생했습니다: ${error.message || error}`,
      );
    }
  }
}
