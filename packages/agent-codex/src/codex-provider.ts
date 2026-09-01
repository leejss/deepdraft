import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { GenerateOptions, LLMProvider } from '@deepdraft/core';
import { Codex } from '@openai/codex-sdk';

const CODEX_TIMEOUT_MS = 600_000;

export interface CodexThreadClient {
  run(
    prompt: string,
    options?: {
      outputSchema?: unknown;
      signal?: AbortSignal;
    },
  ): Promise<{ finalResponse: string }>;
}

export interface CodexClient {
  startThread(options?: {
    model?: string;
    sandboxMode?: 'read-only' | 'workspace-write' | 'danger-full-access';
    workingDirectory?: string;
    skipGitRepoCheck?: boolean;
    networkAccessEnabled?: boolean;
    webSearchMode?: 'disabled' | 'cached' | 'live';
    approvalPolicy?: 'never' | 'on-request' | 'on-failure' | 'untrusted';
  }): CodexThreadClient;
}

function createCodexClient(): CodexClient {
  return new Codex({
    config: {
      history: { persistence: 'none' },
      web_search: 'disabled',
    },
  });
}

export class CodexProvider implements LLMProvider {
  public readonly id = 'codex';
  public readonly name = 'Codex SDK (Local Agent)';

  constructor(
    private readonly modelName?: string,
    private readonly client: CodexClient = createCodexClient(),
  ) {}

  async generate(prompt: string, options?: GenerateOptions): Promise<string> {
    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), 'deepdraft-codex-'),
    );

    try {
      const thread = this.client.startThread({
        model: this.modelName,
        sandboxMode: 'read-only',
        workingDirectory: tempDir,
        skipGitRepoCheck: true,
        networkAccessEnabled: false,
        webSearchMode: 'disabled',
        approvalPolicy: 'never',
      });

      const result = await thread.run(prompt, {
        outputSchema: options?.jsonSchema,
        signal: AbortSignal.timeout(CODEX_TIMEOUT_MS),
      });

      return result.finalResponse.trim();
    } catch (error: unknown) {
      throw new Error(
        `Codex SDK 실행 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { cause: error },
      );
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
}
