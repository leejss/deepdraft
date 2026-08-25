import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execa } from 'execa';
import type { GenerateOptions, LocalAgentLLMProvider } from './types.js';

interface OpenCodeEvent {
  type?: string;
  error?: unknown;
  part?: {
    messageID?: string;
    text?: string;
  };
}

function describeError(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  return JSON.stringify(error);
}

function extractFinalText(stdout: string): string {
  const textByMessage = new Map<string, string[]>();
  let lastMessageId: string | undefined;

  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }

    const event = JSON.parse(line) as OpenCodeEvent;
    if (event.type === 'error') {
      throw new Error(`OpenCode 오류: ${describeError(event.error)}`);
    }
    if (event.type !== 'text' || typeof event.part?.text !== 'string') {
      continue;
    }

    const messageId = event.part.messageID ?? '__ungrouped__';
    const parts = textByMessage.get(messageId) ?? [];
    parts.push(event.part.text);
    textByMessage.set(messageId, parts);
    lastMessageId = messageId;
  }

  const result = lastMessageId
    ? textByMessage.get(lastMessageId)?.join('')
    : undefined;
  if (!result?.trim()) {
    throw new Error('OpenCode CLI가 최종 텍스트 응답을 반환하지 않았습니다.');
  }

  return result.trim();
}

export class OpenCodeProvider implements LocalAgentLLMProvider {
  public readonly kind = 'local-agent' as const;
  public readonly id = 'opencode';
  public readonly name = 'OpenCode CLI (Local Agent)';

  constructor(private readonly modelName?: string) {}

  async generate(prompt: string, _options?: GenerateOptions): Promise<string> {
    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'deepdraft-opencode-'),
    );
    const args = [
      'run',
      '--format',
      'json',
      '--agent',
      'plan',
      '--dir',
      tempDir,
    ];

    if (this.modelName) {
      args.push('--model', this.modelName);
    }

    try {
      const { stdout } = await execa('opencode', args, {
        cwd: tempDir,
        input: prompt,
        timeout: 600000,
      });

      return extractFinalText(stdout);
    } catch (error: any) {
      throw new Error(
        `OpenCode CLI 실행 중 오류가 발생했습니다: ${error.message || error}`,
      );
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
}
