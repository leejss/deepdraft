import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execa } from 'execa';
import type { GenerateOptions, LLMProvider } from './types.js';

export class AgyProvider implements LLMProvider {
  public readonly id = 'agy';
  public readonly name = 'Antigravity CLI (Local Agent)';

  constructor(private readonly modelName?: string) {}

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const fullPrompt = options?.systemPrompt
      ? `System Instructions:\n${options.systemPrompt}\n\nUser Request:\n${prompt}`
      : prompt;

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepdraft-agy-'));
    const args = ['-p', fullPrompt, '--sandbox', '--disable-slash-commands'];
    if (options?.jsonSchema) {
      args.push(
        '--output-format',
        'json',
        '--json-schema',
        JSON.stringify(options.jsonSchema),
      );
    }
    if (this.modelName) {
      args.push('--model', this.modelName);
    }

    try {
      const { stdout } = await execa('agy', args, {
        cwd: tempDir,
        timeout: 300000, // 5분 타임아웃
      });

      if (options?.jsonSchema) {
        const envelope = JSON.parse(stdout) as {
          status?: string;
          structured_output?: unknown;
        };
        if (envelope.status !== 'SUCCESS' || !envelope.structured_output) {
          throw new Error(
            'agy CLI가 유효한 구조화 응답을 반환하지 않았습니다.',
          );
        }
        return JSON.stringify(envelope.structured_output);
      }

      return stdout.trim();
    } catch (error: any) {
      throw new Error(
        `agy CLI 실행 중 오류가 발생했습니다: ${error.message || error}`,
      );
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
}
