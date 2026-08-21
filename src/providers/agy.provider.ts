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

    const args = ['-p', fullPrompt, '--dangerously-skip-permissions'];
    if (this.modelName) {
      args.push('--model', this.modelName);
    }

    try {
      const { stdout } = await execa('agy', args, {
        timeout: 300000, // 5분 타임아웃
      });

      return stdout.trim();
    } catch (error: any) {
      throw new Error(
        `agy CLI 실행 중 오류가 발생했습니다: ${error.message || error}`,
      );
    }
  }
}
