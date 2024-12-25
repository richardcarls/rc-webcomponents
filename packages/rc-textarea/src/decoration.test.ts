import { test, expect, describe } from 'vitest';
import { findEdit, mapDecorationsThroughChange, isLargeChange } from './decoration.ts';

describe('findEdit', () => {
  test('insertion at start', () => {
    const e = findEdit('', 'abc');
    expect(e).toEqual({ start: 0, removed: 0, inserted: 3 });
  });

  test('insertion in the middle', () => {
    const e = findEdit('hello', 'helloXY');
    expect(e).toEqual({ start: 5, removed: 0, inserted: 2 });
  });

  test('deletion from end', () => {
    const e = findEdit('hello', 'hel');
    expect(e).toEqual({ start: 3, removed: 2, inserted: 0 });
  });

  test('deletion from middle', () => {
    const e = findEdit('abcde', 'abe');
    expect(e).toEqual({ start: 2, removed: 2, inserted: 0 });
  });

  test('replacement in middle', () => {
    // 'abcde' → 'abXYZe': shared prefix 'ab' (start=2), shared suffix 'e' (oldEnd=4, newEnd=5)
    // removed = oldEnd - start = 4 - 2 = 2 ('cd'), inserted = newEnd - start = 5 - 2 = 3 ('XYZ')
    const e = findEdit('abcde', 'abXYZe');
    expect(e).toEqual({ start: 2, removed: 2, inserted: 3 });
  });

  test('no change', () => {
    const e = findEdit('same', 'same');
    expect(e).toEqual({ start: 4, removed: 0, inserted: 0 });
  });

  test('full replacement', () => {
    const e = findEdit('abc', 'xyz');
    expect(e).toEqual({ start: 0, removed: 3, inserted: 3 });
  });
});

describe('mapDecorationsThroughChange', () => {
  test('mark before the edit is unchanged', () => {
    const { decorations } = mapDecorationsThroughChange(
      [{ id: 'd1', type: 'mark', range: { from: 0, to: 3 } }],
      [],
      'hello world',
      'hello Xworld', // insert X at offset 6
    );
    expect(decorations[0].range).toEqual({ from: 0, to: 3 });
  });

  test('mark after the edit is shifted by the delta', () => {
    const { decorations } = mapDecorationsThroughChange(
      [{ id: 'd1', type: 'mark', range: { from: 6, to: 11 } }],
      [],
      'hello world',
      'hello Xworld', // insert X at offset 6, delta = +1
    );
    expect(decorations[0].range).toEqual({ from: 7, to: 12 });
  });

  test('mark entirely inside a deletion is removed', () => {
    const { decorations } = mapDecorationsThroughChange(
      [{ id: 'd1', type: 'mark', range: { from: 2, to: 4 } }],
      [],
      'hello',
      'ho', // delete 'ell' (offset 1–4), range 2-4 is inside
    );
    // Clamped to zero-length — removed
    expect(decorations).toHaveLength(0);
  });

  test('line decoration after deleted lines shifts up', () => {
    // Delete line 2 ('b\n') from a 5-line doc: editStartLine=2, linesRemoved=1, editEndLine=3
    // Decoration at line 4 > editEndLine → shifts by lineDelta(-1) → line 3
    const { decorations } = mapDecorationsThroughChange(
      [{ id: 'd1', type: 'line', line: 4 }],
      [],
      'a\nb\nc\nd\ne',
      'a\nc\nd\ne', // delete line 2 (b\n)
    );
    expect(decorations[0].line).toBe(3);
  });

  test('line decoration after inserted lines shifts down', () => {
    // Insert 'new\n' before 'b' in 'a\nb\nc': editStartLine=2, linesInserted=1, editEndLine=2
    // Decoration at line 3 > editEndLine → shifts by lineDelta(+1) → line 4
    const { decorations } = mapDecorationsThroughChange(
      [{ id: 'd1', type: 'line', line: 3 }],
      [],
      'a\nb\nc',
      'a\nnew\nb\nc', // insert line before b
    );
    expect(decorations[0].line).toBe(4);
  });

  test('diagnostic line shifts with inserted lines', () => {
    // Insert 'new\n' before 'b' in 'a\nb\nc': editStartLine=2, editEndLine=2
    // Diagnostic at line 3 > editEndLine → shifts by lineDelta(+1) → line 4
    const { diagnostics } = mapDecorationsThroughChange(
      [],
      [{ id: 'diag1', line: 3, severity: 'error', message: 'err' }],
      'a\nb\nc',
      'a\nnew\nb\nc',
    );
    expect(diagnostics[0].line).toBe(4);
  });
});

describe('isLargeChange', () => {
  test('removing more than 50 chars is a large change', () => {
    const longText = 'a'.repeat(60);
    const edit = findEdit(longText, '');
    expect(isLargeChange(longText, edit)).toBe(true);
  });

  test('removing more than 50% of the document is a large change', () => {
    // Both conditions must hold: changeSize > 50 AND changeSize > oldValue.length * 0.5
    // 120-char doc, remove 65 chars: 65 > 50 ✓ and 65 > 60 (50% of 120) ✓
    const text = 'a'.repeat(120);
    const edit = findEdit(text, 'a'.repeat(55));
    expect(isLargeChange(text, edit)).toBe(true);
  });

  test('a single-character insertion is not a large change', () => {
    const edit = findEdit('hello', 'helllo');
    expect(isLargeChange('hello', edit)).toBe(false);
  });

  test('an empty document edit is not a large change', () => {
    const edit = findEdit('', 'a');
    expect(isLargeChange('', edit)).toBe(false);
  });
});
