import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { type CodexClient, CodexProvider } from '@deepdraft/agent-codex';
import {
  createPromptContext,
  formatLocalDate,
  type GenerateOptions,
  generateOutline,
  generateWithProvider,
  type LLMProvider,
  lintAndPolish,
  parseOutputLanguage,
  runPipeline,
} from '@deepdraft/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadSoulPrompt } from '../src/soul-prompt.js';
import { saveMarkdownFile, slugify } from '../src/utils/file.js';
import { logger } from '../src/utils/logger.js';

const temporaryDirectories: string[] = [];
const TEST_SOUL_PROMPT = '# Test Soul\n\nWrite with deliberate precision.';

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      fs.rm(directory, {
        recursive: true,
        force: true,
      }),
    ),
  );
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

class MockProvider implements LLMProvider {
  public readonly id = 'mock';
  public readonly name = 'Mock Provider';
  public readonly prompts: string[] = [];

  async generate(prompt: string, _options?: GenerateOptions): Promise<string> {
    this.prompts.push(prompt);

    if (prompt.includes('design the most appropriate direction')) {
      return JSON.stringify({
        title: 'PostgreSQL MVCC 동작 원리와 Vacuum 튜닝',
        coreProblem:
          '트랜잭션 격리 보장과 Dead Tuple 증가로 인한 테이블 블로트',
        targetAngle:
          'Read Committed와 Repeatable Read 격리 수준에서의 스냅샷 생성 및 가비지 수거',
        keyQuestions: [
          '스냅샷은 어떻게 동작하는가?',
          'Vacuum은 어떤 시점에 락을 유발하는가?',
        ],
      });
    }

    if (prompt.includes('Design an article blueprint')) {
      return JSON.stringify({
        title: 'PostgreSQL MVCC 동작 원리와 Vacuum 튜닝',
        sections: [
          {
            heading: '문제의 발단: Dead Tuple과 테이블 블로트',
            tldr: 'MVCC의 UPDATE 방식은 Dead Tuple과 테이블 블로트를 만든다.',
            narrativeFlow: 'UPDATE 시 새 튜플 생성 및 xmin/xmax 헤더 메커니즘',
          },
          {
            heading: 'MVCC 내부 메커니즘 딥다이브',
            tldr: '스냅샷과 가시성 판정이 각 트랜잭션에 보이는 튜플을 결정한다.',
            narrativeFlow: 'Snapshot isolation 및 Visibility map',
          },
          {
            heading: 'Vacuum 튜닝과 실무 인사이트',
            tldr: 'Vacuum 튜닝은 트랜잭션 수명과 정리 비용을 함께 고려해야 한다.',
            narrativeFlow:
              'autovacuum_vacuum_cost_limit 조정 및 Long-running transaction의 위험',
          },
        ],
      });
    }

    if (prompt.includes('Write a complete, engaging')) {
      return `# PostgreSQL MVCC 동작 원리와 Vacuum 튜닝

PostgreSQL에서 대량의 UPDATE/DELETE가 발생하는 프로덕션 환경에서 가장 흔히 마주치는 장애 중 하나는 테이블 블로트(Table Bloat)입니다.

\`\`\`mermaid
sequenceDiagram
    participant App as Application
    participant PG as PostgreSQL Engine
    participant Disk as Storage
    App->>PG: UPDATE query
    PG->>Disk: Write new row (new xmin)
    PG->>Disk: Mark old row as dead (xmax)
\`\`\`

## Dead Tuple과 xmin/xmax 메커니즘
PostgreSQL의 MVCC는 기존 레코드를 직접 덮어쓰지 않고 새로운 버전을 추가합니다.

\`\`\`typescript
interface TupleHeader {
  xmin: number;
  xmax: number;
  t_ctid: string;
}
\`\`\`

## 정리하며
MVCC의 원리를 이해하면 테이블 블로트를 사전에 방지할 수 있습니다.`;
    }

    if (prompt.includes('Revise the following technical article')) {
      return `# PostgreSQL MVCC 동작 원리와 Vacuum 튜닝

PostgreSQL에서 대량의 UPDATE/DELETE가 발생하는 프로덕션 환경에서 가장 흔히 마주치는 장애 중 하나는 테이블 블로트(Table Bloat)입니다.

\`\`\`mermaid
sequenceDiagram
    participant App as Application
    participant PG as PostgreSQL Engine
    participant Disk as Storage
    App->>PG: UPDATE query
    PG->>Disk: Write new row (new xmin)
    PG->>Disk: Mark old row as dead (xmax)
\`\`\`

## Dead Tuple과 xmin/xmax 메커니즘
PostgreSQL의 MVCC는 기존 레코드를 직접 덮어쓰지 않고 새로운 버전을 추가합니다.

## 정리하며
MVCC의 원리를 이해하면 테이블 블로트를 사전에 방지할 수 있습니다.`;
    }

    if (prompt.includes('generate its frontmatter metadata')) {
      return JSON.stringify({
        title: 'PostgreSQL MVCC 동작 원리와 Vacuum 튜닝',
        description:
          'PostgreSQL의 MVCC 내부 메커니즘과 Dead Tuple로 인한 성능 저하를 방지하는 Vacuum 튜닝 전략을 다룹니다.',
        tags: ['PostgreSQL', 'Database', 'MVCC', 'Performance'],
        category: 'Database',
      });
    }

    return 'Default Response';
  }
}

describe('DeepDraft Core Tests', () => {
  it('slugify should convert title to URL-safe slug', () => {
    expect(slugify('PostgreSQL MVCC 동작 원리')).toBe(
      'postgresql-mvcc-동작-원리',
    );
    expect(slugify('Node.js Event Loop & Libuv!!')).toBe(
      'nodejs-event-loop-libuv',
    );
  });

  it('language should accept only ko and en', () => {
    expect(parseOutputLanguage('ko')).toBe('ko');
    expect(parseOutputLanguage('en')).toBe('en');
    expect(() => parseOutputLanguage('auto')).toThrow('Unsupported language');
    expect(() => parseOutputLanguage('ja')).toThrow('Unsupported language');
    expect(
      createPromptContext({
        language: 'en',
        level: 'intermediate',
        soulPrompt: TEST_SOUL_PROMPT,
      }),
    ).toContain('Write all reader-facing prose in English');
    expect(
      createPromptContext({
        language: 'ko',
        level: 'intermediate',
        soulPrompt: TEST_SOUL_PROMPT,
      }),
    ).toContain('Write all reader-facing prose in Korean');
    const promptContext = createPromptContext({
      language: 'en',
      level: 'intermediate',
      soulPrompt: TEST_SOUL_PROMPT,
    });
    expect(promptContext).toContain(TEST_SOUL_PROMPT);
    expect(promptContext).not.toContain('# Soul of DeepDraft');
  });

  it('loads the default Soul or an explicit absolute or relative path', async () => {
    const defaultSoul = await loadSoulPrompt();
    expect(defaultSoul).toContain('# Soul of DeepDraft');

    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'deepdraft-soul-test-'),
    );
    temporaryDirectories.push(directory);
    const soulPath = path.join(directory, 'backend.md');
    await fs.writeFile(soulPath, `  ${TEST_SOUL_PROMPT}\n`, 'utf-8');

    await expect(loadSoulPrompt(soulPath)).resolves.toBe(TEST_SOUL_PROMPT);
    await expect(
      loadSoulPrompt(path.relative(process.cwd(), soulPath)),
    ).resolves.toBe(TEST_SOUL_PROMPT);
  });

  it('rejects an unreadable, empty, or blank custom Soul path', async () => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'deepdraft-soul-test-'),
    );
    temporaryDirectories.push(directory);
    const emptySoulPath = path.join(directory, 'empty.md');
    await fs.writeFile(emptySoulPath, '  \n', 'utf-8');

    await expect(
      loadSoulPrompt(path.join(directory, 'missing.md')),
    ).rejects.toThrow('Soul 파일을 읽을 수 없습니다');
    await expect(loadSoulPrompt(emptySoulPath)).rejects.toThrow(
      'Soul 파일이 비어 있습니다',
    );
    await expect(loadSoulPrompt('  ')).rejects.toThrow(
      'Soul 파일 경로가 비어 있습니다',
    );
  });

  it('lint should enforce evidence and instruction-leakage guardrails in one call', async () => {
    const generate = vi.fn().mockResolvedValue('# 검토된 글');
    const provider: LLMProvider = {
      id: 'lint-test',
      name: 'Lint Test Provider',
      generate,
    };

    const result = await lintAndPolish(
      '# 초안\n\n처리량이 26.2% 감소했다.',
      provider,
      {
        language: 'ko',
        level: 'intermediate',
        soulPrompt: TEST_SOUL_PROMPT,
      },
    );

    expect(result).toBe('# 검토된 글');
    expect(generate).toHaveBeenCalledOnce();

    const [prompt, options] = generate.mock.calls[0];
    expect(prompt).toContain('Do not replace an unsupported number');
    expect(prompt).toContain('version-dependent implementation details');
    expect(prompt).toContain('A code sample that measures one metric');
    expect(prompt).toContain('system instructions');
    expect(prompt).toContain('Do not append a generic "Next Steps"');
    expect(options).toEqual({});
    expect(prompt).toContain('Write all reader-facing prose in Korean');
  });

  it('Codex SDK should run in an isolated read-only thread', async () => {
    const run = vi
      .fn()
      .mockResolvedValue({ finalResponse: '  codex result  ' });
    const startThread = vi.fn().mockReturnValue({ run });
    const client: CodexClient = { startThread };
    const schema = {
      type: 'object',
      required: ['ok'],
      properties: { ok: { type: 'boolean' } },
    };

    const result = await new CodexProvider('gpt-test', client).generate(
      '테스트',
      { jsonSchema: schema },
    );

    expect(result).toBe('codex result');
    expect(startThread).toHaveBeenCalledOnce();
    expect(startThread).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-test',
        sandboxMode: 'read-only',
        approvalPolicy: 'never',
        skipGitRepoCheck: true,
        networkAccessEnabled: false,
        webSearchMode: 'disabled',
        workingDirectory: expect.stringContaining('deepdraft-codex-'),
      }),
    );
    expect(run).toHaveBeenCalledWith('테스트', {
      outputSchema: schema,
      signal: expect.any(AbortSignal),
    });

    const [{ workingDirectory }] = startThread.mock.calls[0];
    await expect(fs.access(workingDirectory)).rejects.toThrow();
  });

  it('should prepend prompt context for Codex', async () => {
    const generate = vi.fn().mockResolvedValue('result');
    const provider: LLMProvider = {
      id: 'codex-test',
      name: 'Codex Test Provider',
      generate,
    };

    await generateWithProvider(provider, 'Task', {}, 'Prompt context');

    expect(generate).toHaveBeenCalledWith('Prompt context\n\nTask', {});
  });

  it('runPipeline should execute all 5 stages and produce markdown with frontmatter', async () => {
    const mockProvider = new MockProvider();
    const progressSteps: number[] = [];

    const result = await runPipeline({
      input: 'PostgreSQL MVCC와 Vacuum',
      provider: mockProvider,
      language: 'ko',
      soulPrompt: TEST_SOUL_PROMPT,
      onProgress: (step) => progressSteps.push(step),
    });

    expect(progressSteps).toEqual([1, 2, 3, 4, 5]);
    expect(mockProvider.prompts).toHaveLength(5);
    expect(
      mockProvider.prompts.every((prompt) => prompt.includes(TEST_SOUL_PROMPT)),
    ).toBe(true);
    expect(result.frontmatter.title).toBe(
      'PostgreSQL MVCC 동작 원리와 Vacuum 튜닝',
    );
    expect(result.frontmatter.tags).toContain('PostgreSQL');
    expect(result.outline.sections).toHaveLength(3);
    expect(result.markdown).toContain('---');
    expect(result.markdown).toContain(
      'PostgreSQL MVCC 동작 원리와 Vacuum 튜닝',
    );
    expect(result.markdown).toContain('```mermaid');
  });

  it('runPipeline should log each stage result in debug mode', async () => {
    const log = vi.spyOn(logger, 'log').mockImplementation(() => {});

    await runPipeline({
      input: 'PostgreSQL MVCC와 Vacuum',
      provider: new MockProvider(),
      language: 'ko',
      soulPrompt: TEST_SOUL_PROMPT,
      onDebug: (result) => logger.log(result),
    });

    expect(log).toHaveBeenCalledTimes(5);
    expect(log.mock.calls.map(([result]) => result)).toEqual([
      expect.objectContaining({ targetAngle: expect.any(String) }),
      expect.objectContaining({ sections: expect.any(Array) }),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        markdown: expect.any(String),
        frontmatter: expect.any(Object),
      }),
    ]);
  });

  it('generateOutline should retry invalid structured output and then fail', async () => {
    const generate = vi.fn().mockResolvedValue('{"sections":[null]}');
    const provider: LLMProvider = {
      id: 'invalid-mock',
      name: 'Invalid Mock',
      generate,
    };

    await expect(
      generateOutline(
        {
          title: '테스트 글',
          coreProblem: '핵심 문제',
          targetAngle: '분석 관점',
          keyQuestions: [],
        },
        provider,
        {
          language: 'ko',
          level: 'intermediate',
          soulPrompt: TEST_SOUL_PROMPT,
        },
      ),
    ).rejects.toThrow('Structured generation failed after all attempts');

    expect(generate).toHaveBeenCalledTimes(2);
  });

  it('saveMarkdownFile should protect explicit output unless force is set', async () => {
    const directory = await fs.mkdtemp(
      path.join(os.tmpdir(), 'deepdraft-test-'),
    );
    temporaryDirectories.push(directory);
    const outputPath = path.join(directory, 'post.md');
    await fs.writeFile(outputPath, '기존 글', 'utf-8');

    await expect(saveMarkdownFile('새 글', { outputPath })).rejects.toThrow(
      '--force',
    );
    expect(await fs.readFile(outputPath, 'utf-8')).toBe('기존 글');

    await saveMarkdownFile('새 글', { outputPath, force: true });
    expect(await fs.readFile(outputPath, 'utf-8')).toBe('새 글');
  });

  it('formatLocalDate should use local calendar fields', () => {
    const localMidnight = new Date(2026, 7, 22, 0, 30);
    expect(formatLocalDate(localMidnight)).toBe('2026-08-22');
  });
});
