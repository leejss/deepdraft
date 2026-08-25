import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execa } from 'execa';
import type { GenerateOptions, LocalAgentLLMProvider } from './types.js';

interface ClaudeJsonResult {
  is_error?: boolean;
  result?: unknown;
  structured_output?: unknown;
}

function unwrapClaudeResult(stdout: string): string {
  const envelope = JSON.parse(stdout) as ClaudeJsonResult;

  if (envelope.is_error) {
    throw new Error('Claude CLI가 오류 응답을 반환했습니다.');
  }

  const result = envelope.structured_output ?? envelope.result;
  if (typeof result === 'string') {
    return result.trim();
  }
  if (result !== undefined) {
    return JSON.stringify(result);
  }

  throw new Error('Claude CLI가 유효한 구조화 응답을 반환하지 않았습니다.');
}

export class ClaudeProvider implements LocalAgentLLMProvider {
  public readonly kind = 'local-agent' as const;
  public readonly id = 'claude';
  public readonly name = 'Claude CLI (Local Agent)';

  constructor(private readonly modelName?: string) {}

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'deepdraft-claude-'),
    );
    const args = [
      '--print',
      '--safe-mode',
      '--disable-slash-commands',
      '--no-session-persistence',
      '--permission-mode',
      'plan',
      '--tools',
      '',
    ];

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
      const { stdout } = await execa('claude', args, {
        cwd: tempDir,
        input: prompt,
        timeout: 600000,
      });

      return options?.jsonSchema ? unwrapClaudeResult(stdout) : stdout.trim();
    } catch (error: any) {
      throw new Error(
        `Claude CLI 실행 중 오류가 발생했습니다: ${error.message || error}`,
      );
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
}
