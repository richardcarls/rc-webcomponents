import { test, expect, describe } from 'vitest';

import { matchPatternResults } from './pattern-matcher.ts';

describe('matchPatternResults', () => {
  // ── Basic matching ────────────────────────────────────────────────────

  test('single pattern match produces one mark decoration', () => {
    const { markDecorations } = matchPatternResults('hello world', [
      { id: 'p1', pattern: /world/g, className: 'w' },
    ]);
    expect(markDecorations).toHaveLength(1);
    expect(markDecorations[0].from).toBe(6);
    expect(markDecorations[0].to).toBe(11);
    expect(markDecorations[0].className).toBe('w');
    expect(markDecorations[0].type).toBe('mark');
  });

  test('multiple matches from one pattern produce multiple mark decorations', () => {
    const { markDecorations } = matchPatternResults('foo bar foo', [
      { id: 'p1', pattern: /foo/g, className: 'f' },
    ]);
    expect(markDecorations).toHaveLength(2);
    expect(markDecorations[0].from).toBe(0);
    expect(markDecorations[0].to).toBe(3);
    expect(markDecorations[1].from).toBe(8);
    expect(markDecorations[1].to).toBe(11);
  });

  test('multiple patterns each contribute their matches', () => {
    const { markDecorations } = matchPatternResults('hello world', [
      { id: 'p1', pattern: /hello/g, className: 'a' },
      { id: 'p2', pattern: /world/g, className: 'b' },
    ]);
    expect(markDecorations).toHaveLength(2);
    expect(markDecorations.find(d => d.className === 'a')?.from).toBe(0);
    expect(markDecorations.find(d => d.className === 'b')?.from).toBe(6);
  });

  test('non-global pattern is treated as global (all occurrences matched)', () => {
    const { markDecorations } = matchPatternResults('foo foo', [
      { id: 'p1', pattern: /foo/, className: 'f' }, // no 'g' flag
    ]);
    expect(markDecorations).toHaveLength(2);
  });

  test('zero-length match is skipped to avoid infinite loops', () => {
    const { markDecorations } = matchPatternResults('abc', [
      { id: 'p1', pattern: /x*/g, className: 'x' }, // matches empty string everywhere
    ]);
    expect(markDecorations).toHaveLength(0);
  });

  test('no match returns empty arrays', () => {
    const { markDecorations, lineDecorations } = matchPatternResults('hello', [
      { id: 'p1', pattern: /xyz/g },
    ]);
    expect(markDecorations).toHaveLength(0);
    expect(lineDecorations).toHaveLength(0);
  });

  test('empty value returns empty arrays', () => {
    const { markDecorations, lineDecorations } = matchPatternResults('', [
      { id: 'p1', pattern: /hello/g },
    ]);
    expect(markDecorations).toHaveLength(0);
    expect(lineDecorations).toHaveLength(0);
  });

  // ── Mark decoration properties ────────────────────────────────────────

  test('all formatting properties are copied to the mark decoration', () => {
    const { markDecorations } = matchPatternResults('hello', [
      {
        id: 'p1',
        pattern: /hello/g,
        className: 'cls',
        bold: true,
        italic: true,
        color: '#ff0000',
        background: '#00ff00',
        underline: 'wavy' as const,
        underlineColor: '#0000ff',
        attributes: { 'data-kind': 'keyword' },
      },
    ]);
    const d = markDecorations[0];
    expect(d.className).toBe('cls');
    expect(d.bold).toBe(true);
    expect(d.italic).toBe(true);
    expect(d.color).toBe('#ff0000');
    expect(d.background).toBe('#00ff00');
    expect(d.underline).toBe('wavy');
    expect(d.underlineColor).toBe('#0000ff');
    expect(d.attributes).toEqual({ 'data-kind': 'keyword' });
  });

  test('undefined optional properties are not set to truthy values', () => {
    const { markDecorations } = matchPatternResults('hello', [
      { id: 'p1', pattern: /hello/g },
    ]);
    const d = markDecorations[0];
    expect(d.className).toBeUndefined();
    expect(d.bold).toBeUndefined();
    expect(d.color).toBeUndefined();
  });

  // ── createLineDecoration ──────────────────────────────────────────────

  test('createLineDecoration generates a paired line decoration', () => {
    const { markDecorations, lineDecorations } = matchPatternResults('TODO fix', [
      {
        id: 'p1',
        pattern: /TODO/g,
        className: 'todo',
        createLineDecoration: () => ({ message: 'todo found', className: 'todo-line' }),
      },
    ]);
    expect(markDecorations).toHaveLength(1);
    expect(lineDecorations).toHaveLength(1);
    expect(lineDecorations[0].type).toBe('line');
    expect(lineDecorations[0].message).toBe('todo found');
    expect(lineDecorations[0].className).toBe('todo-line');
    expect(lineDecorations[0].line).toBe(1);
  });

  test('createLineDecoration receives the regex match array', () => {
    let capturedMatch: RegExpMatchArray | null = null;
    matchPatternResults('error: oops', [
      {
        id: 'p1',
        pattern: /error: (\w+)/g,
        createLineDecoration: (m) => {
          capturedMatch = m;
          return null;
        },
      },
    ]);
    expect(capturedMatch).not.toBeNull();
    expect(capturedMatch![0]).toBe('error: oops');
    expect(capturedMatch![1]).toBe('oops');
  });

  test('createLineDecoration returning null skips that line decoration', () => {
    const { lineDecorations } = matchPatternResults('hello', [
      {
        id: 'p1',
        pattern: /hello/g,
        createLineDecoration: () => null,
      },
    ]);
    expect(lineDecorations).toHaveLength(0);
  });

  test('match on second line produces line number 2', () => {
    const { lineDecorations } = matchPatternResults('first\nTODO', [
      {
        id: 'p1',
        pattern: /TODO/g,
        createLineDecoration: () => ({ message: 'found' }),
      },
    ]);
    expect(lineDecorations).toHaveLength(1);
    expect(lineDecorations[0].line).toBe(2);
  });

  test('match on third line produces line number 3', () => {
    const { lineDecorations } = matchPatternResults('a\nb\nTODO', [
      {
        id: 'p1',
        pattern: /TODO/g,
        createLineDecoration: () => ({ message: 'found' }),
      },
    ]);
    expect(lineDecorations[0].line).toBe(3);
  });

  test('multiple matches on different lines produce separate line decorations', () => {
    const { lineDecorations } = matchPatternResults('TODO\nfoo\nTODO', [
      {
        id: 'p1',
        pattern: /TODO/g,
        createLineDecoration: () => ({ message: 'found' }),
      },
    ]);
    expect(lineDecorations).toHaveLength(2);
    expect(lineDecorations[0].line).toBe(1);
    expect(lineDecorations[1].line).toBe(3);
  });

  test('messageClassName is passed through to line decoration', () => {
    const { lineDecorations } = matchPatternResults('error here', [
      {
        id: 'p1',
        pattern: /error/g,
        createLineDecoration: () => ({
          message: 'an error',
          messageClassName: 'error-class',
        }),
      },
    ]);
    expect(lineDecorations[0].messageClassName).toBe('error-class');
  });
});
