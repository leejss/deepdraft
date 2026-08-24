import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execa } from 'execa';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createPromptContext,
  parseOutputLanguage,
} from '../src/core/language.js';
import { runPipeline } from '../src/core/pipeline.js';
import { lintAndPolish } from '../src/core/stages/lint.js';
import { generateOutline } from '../src/core/stages/outline.js';
import { AgyProvider } from '../src/providers/agy.provider.js';
import { CodexProvider } from '../src/providers/codex.provider.js';
import { createProvider } from '../src/providers/factory.js';
import { generateWithProvider } from '../src/providers/generate.js';
import type {
  ApiLLMProvider,
  GenerateOptions,
  LocalAgentLLMProvider,
} from '../src/providers/types.js';
import { formatLocalDate } from '../src/utils/date.js';
import { saveMarkdownFile, slugify } from '../src/utils/file.js';

vi.mock('execa', () => ({
  execa: vi.fn().mockResolvedValue({ stdout: '' }),
}));

const temporaryDirectories: string[] = [];

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

class MockProvider implements LocalAgentLLMProvider {
  public readonly kind = 'local-agent' as const;
  public readonly id = 'mock';
  public readonly name = 'Mock Provider';

  async generate(prompt: string, _options?: GenerateOptions): Promise<string> {
    if (prompt.includes('design the most appropriate direction')) {
      return JSON.stringify({
        title: 'PostgreSQL MVCC 동작 원리와 Vacuum 튜닝',
        coreProblem:
          '트랜잭션 격리 보장과 Dead Tuple 증가로 인한 테이블 블로트',
        targetAngle:
          'Read Committed와 Repeatable Read 격리 수준에서의 스냅샷 생성 및 가비지 수거',
        narrativeArchetype: '런타임 딥다이브',
        narrativeStrategy: '문제 정의 및 내부 메커니즘 분석',
        keyQuestions: [
          '스냅샷은 어떻게 동작하는가?',
          'Vacuum은 어떤 시점에 락을 유발하는가?',
        ],
      });
    }

    if (prompt.includes('Design an article blueprint')) {
      return JSON.stringify({
        title: 'PostgreSQL MVCC 동작 원리와 Vacuum 튜닝',
        narrativeArchetype: '런타임 딥다이브',
        sections: [
          {
            heading: '문제의 발단: Dead Tuple과 테이블 블로트',
            narrativeFlow: 'UPDATE 시 새 튜플 생성 및 xmin/xmax 헤더 메커니즘',
            hasMermaid: false,
            mermaidDescription: '',
            hasCode: false,
            codeDescription: '',
          },
          {
            heading: 'MVCC 내부 메커니즘 딥다이브',
            narrativeFlow: 'Snapshot isolation 및 Visibility map',
            hasMermaid: true,
            mermaidDescription: '스냅샷 생성 및 튜플 가시성 판별 시퀀스',
            hasCode: true,
            codeDescription: '튜플 헤더 구조체 스니펫',
          },
          {
            heading: 'Vacuum 튜닝과 실무 인사이트',
            narrativeFlow:
              'autovacuum_vacuum_cost_limit 조정 및 Long-running transaction의 위험',
            hasMermaid: false,
            mermaidDescription: '',
            hasCode: false,
            codeDescription: '',
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

  it('createProvider should use only the explicitly selected provider', async () => {
    const agy = await createProvider({ provider: 'agy' });
    expect(agy.id).toBe('agy');

    const codex = await createProvider({ provider: 'codex' });
    expect(codex.id).toBe('codex');

    await expect(createProvider({ provider: 'unknown' })).rejects.toThrow(
      'Unknown provider',
    );
  });

  it('createProvider should require the selected API provider key', async () => {
    vi.stubEnv('OPENAI_API_KEY', '');
    await expect(createProvider({ provider: 'openai' })).rejects.toThrow(
      'OPENAI_API_KEY',
    );
  });

  it('language should accept only ko and en', () => {
    expect(parseOutputLanguage('ko')).toBe('ko');
    expect(parseOutputLanguage('en')).toBe('en');
    expect(() => parseOutputLanguage('auto')).toThrow('Unsupported language');
    expect(() => parseOutputLanguage('ja')).toThrow('Unsupported language');
    expect(createPromptContext('en')).toContain(
      'Write all reader-facing prose in English',
    );
    expect(createPromptContext('ko')).toContain(
      'Write all reader-facing prose in Korean',
    );
  });

  it('lint should enforce evidence and instruction-leakage guardrails in one call', async () => {
    const generate = vi.fn().mockResolvedValue('# 검토된 글');
    const provider: LocalAgentLLMProvider = {
      kind: 'local-agent',
      id: 'lint-test',
      name: 'Lint Test Provider',
      generate,
    };

    const result = await lintAndPolish(
      '# 초안\n\n처리량이 26.2% 감소했다.',
      provider,
      { language: 'ko' },
    );

    expect(result).toBe('# 검토된 글');
    expect(generate).toHaveBeenCalledOnce();

    const [prompt, options] = generate.mock.calls[0];
    expect(prompt).toContain('Do not replace an unsupported number');
    expect(prompt).toContain('version-dependent implementation details');
    expect(prompt).toContain('A code sample that measures one metric');
    expect(prompt).toContain('system instructions');
    expect(prompt).toContain('Do not append a generic "Next Steps"');
    expect(options).toMatchObject({ temperature: 0.2, maxTokens: 8000 });
    expect(prompt).toContain('Write all reader-facing prose in Korean');
  });

  it('local providers should run in isolated sandboxes without bypass flags', async () => {
    const execaMock = vi.mocked(execa);
    execaMock.mockImplementation(async (command, args) => {
      if (command === 'codex') {
        const outputIndex = args?.indexOf('-o') ?? -1;
        const outputFile = args?.[outputIndex + 1];
        if (outputFile) {
          await fs.writeFile(outputFile, 'codex result', 'utf-8');
        }
      }
      return { stdout: 'agy result' } as Awaited<ReturnType<typeof execa>>;
    });

    const agyResult = await new AgyProvider().generate('테스트');
    const codexResult = await new CodexProvider().generate('테스트');
    const agyCall = execaMock.mock.calls.find(([command]) => command === 'agy');
    const codexCall = execaMock.mock.calls.find(
      ([command]) => command === 'codex',
    );

    expect(agyResult).toBe('agy result');
    expect(codexResult).toBe('codex result');
    expect(agyCall?.[1]).toContain('--sandbox');
    expect(agyCall?.[1]).not.toContain('--dangerously-skip-permissions');
    expect(codexCall?.[1]).toContain('read-only');
    expect(codexCall?.[1]).not.toContain(
      '--dangerously-bypass-approvals-and-sandbox',
    );
    expect(agyCall?.[2]?.cwd).toContain('deepdraft-agy-');
    expect(codexCall?.[2]?.cwd).toContain('deepdraft-codex-');
  });

  it('should route prompt context by provider kind', async () => {
    const localGenerate = vi.fn().mockResolvedValue('local result');
    const apiGenerate = vi.fn().mockResolvedValue('api result');
    const localProvider: LocalAgentLLMProvider = {
      kind: 'local-agent',
      id: 'local',
      name: 'Local Provider',
      generate: localGenerate,
    };
    const apiProvider: ApiLLMProvider = {
      kind: 'api',
      id: 'api',
      name: 'API Provider',
      generate: apiGenerate,
    };

    await generateWithProvider(
      localProvider,
      'Task',
      { temperature: 0.2 },
      'Prompt context',
    );
    await generateWithProvider(
      apiProvider,
      'Task',
      { temperature: 0.2 },
      'Prompt context',
    );

    expect(localGenerate).toHaveBeenCalledWith('Prompt context\n\nTask', {
      temperature: 0.2,
    });
    expect(apiGenerate).toHaveBeenCalledWith('Task', {
      temperature: 0.2,
      systemPrompt: 'Prompt context',
    });
  });

  it('agy should enable JSON output and unwrap structured responses', async () => {
    const execaMock = vi.mocked(execa);
    execaMock.mockResolvedValue({
      stdout: JSON.stringify({
        status: 'SUCCESS',
        structured_output: { ok: true },
      }),
    } as Awaited<ReturnType<typeof execa>>);

    const result = await new AgyProvider().generate('테스트', {
      jsonSchema: {
        type: 'object',
        required: ['ok'],
        properties: { ok: { type: 'boolean' } },
      },
    });
    const agyCall = execaMock.mock.calls.find(([command]) => command === 'agy');

    expect(result).toBe('{"ok":true}');
    expect(agyCall?.[1]).toContain('--output-format');
    expect(agyCall?.[1]).toContain('json');
    expect(agyCall?.[1]).toContain('--json-schema');
  });

  it('runPipeline should execute all 5 stages and produce markdown with frontmatter', async () => {
    const mockProvider = new MockProvider();
    const progressSteps: number[] = [];

    const result = await runPipeline({
      input: 'PostgreSQL MVCC와 Vacuum',
      provider: mockProvider,
      language: 'ko',
      onProgress: (step) => progressSteps.push(step),
    });

    expect(progressSteps).toEqual([1, 2, 3, 4, 5]);
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

  it('generateOutline should retry invalid structured output and use a safe fallback', async () => {
    const generate = vi.fn().mockResolvedValue('{"sections":[null]}');
    const provider: LocalAgentLLMProvider = {
      kind: 'local-agent',
      id: 'invalid-mock',
      name: 'Invalid Mock',
      generate,
    };

    const result = await generateOutline(
      {
        title: '테스트 글',
        coreProblem: '핵심 문제',
        targetAngle: '분석 관점',
        narrativeArchetype: '심층 분석',
        narrativeStrategy: '원인 추적',
        keyQuestions: [],
      },
      provider,
      { language: 'ko' },
    );

    expect(generate).toHaveBeenCalledTimes(2);
    expect(result.sections).toHaveLength(3);
    expect(result.sections.every((section) => section.heading.length > 0)).toBe(
      true,
    );
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
