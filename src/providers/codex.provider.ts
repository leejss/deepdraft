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
      ? `Instructions:\n${options.systemPrompt}\n\nTask:\n${prompt}\n\nReturn the requested result directly after performing only the validation necessary for the task.`
      : prompt;

    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'deepdraft-codex-'),
    );
    const tempOutputFile = path.join(tempDir, 'output.txt');
    const schemaFile = path.join(tempDir, 'schema.json');

    const args = [
      'exec',
      '--sandbox',
      'read-only',
      '--ephemeral',
      '--ignore-user-config',
      '--skip-git-repo-check',
      '--color',
      'never',
      '-C',
      tempDir,
      '-o',
      tempOutputFile,
    ];

    if (options?.jsonSchema) {
      await fs.writeFile(
        schemaFile,
        JSON.stringify(options.jsonSchema),
        'utf-8',
      );
      args.push('--output-schema', schemaFile);
    }

    if (this.modelName) {
      args.push('-m', this.modelName);
    }
    args.push('-');

    try {
      await execa('codex', args, {
        cwd: tempDir,
        input: fullPrompt,
        timeout: 600000, // 심층 리서치 및 장문 생성을 위한 10분 타임아웃
      });

      const result = await fs.readFile(tempOutputFile, 'utf-8');
      return result.trim();
    } catch (error: any) {
      throw new Error(
        `codex CLI 실행 중 오류가 발생했습니다: ${error.message || error}`,
      );
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
}
