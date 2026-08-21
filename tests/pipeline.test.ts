import { describe, expect, it } from 'vitest';
import { runPipeline } from '../src/core/pipeline.js';
import { resolveProvider } from '../src/providers/factory.js';
import type { GenerateOptions, LLMProvider } from '../src/providers/types.js';
import { slugify } from '../src/utils/file.js';

class MockProvider implements LLMProvider {
  public readonly id = 'mock';
  public readonly name = 'Mock Provider';

  async generate(prompt: string, _options?: GenerateOptions): Promise<string> {
    if (
      prompt.includes('글의 방향성과 서사 전략') ||
      prompt.includes('서사 전략') ||
      prompt.includes('쟁점')
    ) {
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

    if (prompt.includes('목차 청사진') || prompt.includes('청사진')) {
      return JSON.stringify({
        title: 'PostgreSQL MVCC 동작 원리와 Vacuum 튜닝',
        narrativeArchetype: '런타임 딥다이브',
        sections: [
          {
            heading: '문제의 발단: Dead Tuple과 테이블 블로트',
            narrativeFlow: 'UPDATE 시 새 튜플 생성 및 xmin/xmax 헤더 메커니즘',
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
          },
        ],
      });
    }

    if (
      prompt.includes('설계된 청사진') ||
      prompt.includes('기술 블로그 본문 전체') ||
      prompt.includes('본문 전체')
    ) {
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

    if (
      prompt.includes('글의 가독성과 완성도 퇴고') ||
      prompt.includes('퇴고')
    ) {
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

    if (prompt.includes('메타데이터(Frontmatter)')) {
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

describe('Tech Blog Engine Core Tests', () => {
  it('slugify should convert title to URL-safe slug', () => {
    expect(slugify('PostgreSQL MVCC 동작 원리')).toBe(
      'postgresql-mvcc-동작-원리',
    );
    expect(slugify('Node.js Event Loop & Libuv!!')).toBe(
      'nodejs-event-loop-libuv',
    );
  });

  it('resolveProvider should support agy and codex', async () => {
    const agy = await resolveProvider({ provider: 'agy' });
    expect(agy.id).toBe('agy');

    const codex = await resolveProvider({ provider: 'codex' });
    expect(codex.id).toBe('codex');
  });

  it('runPipeline should execute all 5 stages and produce markdown with frontmatter', async () => {
    const mockProvider = new MockProvider();
    const progressSteps: number[] = [];

    const result = await runPipeline({
      input: 'PostgreSQL MVCC와 Vacuum',
      provider: mockProvider,
      onProgress: (step) => progressSteps.push(step),
    });

    expect(progressSteps).toEqual([1, 2, 3, 4, 5]);
    expect(result.frontmatter.title).toBe(
      'PostgreSQL MVCC 동작 원리와 Vacuum 튜닝',
    );
    expect(result.frontmatter.tags).toContain('PostgreSQL');
    expect(result.markdown).toContain('---');
    expect(result.markdown).toContain(
      'PostgreSQL MVCC 동작 원리와 Vacuum 튜닝',
    );
    expect(result.markdown).toContain('```mermaid');
  });
});
