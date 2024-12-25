import { test, expect, describe } from 'vitest';
import { matchPatternResults } from './pattern-matcher.ts';

describe('matchPatternResults', () => {
  test('single pattern match generates a mark decoration', () => {
    const { decorations } = matchPatternResults('hello world', [
      { id: 'p1', pattern: /world/g, className: 'w' },
    ]);
    expect(decorations).toHaveLength(1);
    expect(decorations[0].range).toEqual({ from: 6, to: 11 });
    expect(decorations[0].className).toBe('w');
  });

  test('multiple matches from one pattern generate multiple decorations', () => {
    const { decorations } = matchPatternResults('foo bar foo', [
      { id: 'p1', pattern: /foo/g, className: 'f' },
    ]);
    expect(decorations).toHaveLength(2);
    expect(decorations[0].range).toEqual({ from: 0, to: 3 });
    expect(decorations[1].range).toEqual({ from: 8, to: 11 });
  });

  test('non-global pattern is treated as global (matches all occurrences)', () => {
    const { decorations } = matchPatternResults('foo foo', [
      { id: 'p1', pattern: /foo/, className: 'f' }, // not global
    ]);
    expect(decorations).toHaveLength(2); // both "foo" are matched
  });

  test('zero-length match is skipped', () => {
    const { decorations } = matchPatternResults('abc', [
      { id: 'p1', pattern: /x*/g, className: 'x' }, // matches empty string everywhere
    ]);
    // All matches are zero-length and should be skipped
    expect(decorations).toHaveLength(0);
  });

  test('createDiagnostic generates a paired diagnostic', () => {
    const { decorations, diagnostics } = matchPatternResults('TODO fix', [
      {
        id: 'p1',
        pattern: /TODO/g,
        className: 'todo',
        createDiagnostic: () => ({ severity: 'info' as const, message: 'todo found' }),
      },
    ]);
    expect(decorations).toHaveLength(1);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0].message).toBe('todo found');
    expect(diagnostics[0].severity).toBe('info');
    expect(diagnostics[0].line).toBe(1); // first line
  });

  test('match with no className produces decoration with undefined className', () => {
    const { decorations } = matchPatternResults('hello', [
      { id: 'p1', pattern: /hello/g },
    ]);
    expect(decorations[0].className).toBeUndefined();
  });

  test('decoration id encodes the pattern id and range', () => {
    const { decorations } = matchPatternResults('hi', [
      { id: 'mypattern', pattern: /hi/g, className: 'h' },
    ]);
    expect(decorations[0].id).toBe('pattern:mypattern:0:2');
  });

  test('createDiagnostic returning null skips that diagnostic', () => {
    const { diagnostics } = matchPatternResults('hello', [
      {
        id: 'p1',
        pattern: /hello/g,
        createDiagnostic: () => null,
      },
    ]);
    expect(diagnostics).toHaveLength(0);
  });
});
