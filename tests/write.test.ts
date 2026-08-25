import { describe, expect, it } from 'vitest';
import { resolveWriteInput } from '../src/commands/write.js';

describe('resolveWriteInput', () => {
  it('accepts a topic', () => {
    expect(resolveWriteInput('  PostgreSQL MVCC  ', undefined)).toEqual({
      kind: 'topic',
      value: 'PostgreSQL MVCC',
    });
  });

  it('accepts an input file', () => {
    expect(resolveWriteInput(undefined, '  ./notes/mvcc.md  ')).toEqual({
      kind: 'file',
      path: './notes/mvcc.md',
    });
  });

  it('rejects topic and file together', () => {
    expect(() =>
      resolveWriteInput('PostgreSQL MVCC', './notes/mvcc.md'),
    ).toThrow('topic과 --file은 동시에 사용할 수 없습니다.');
  });

  it('rejects an empty input', () => {
    expect(() => resolveWriteInput('  ', undefined)).toThrow(
      'Provide a topic or specify an input file',
    );
  });
});
