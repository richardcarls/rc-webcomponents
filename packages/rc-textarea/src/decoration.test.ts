import { test, expect, describe } from 'vitest';

import {
  findEdit,
  mapDecorationsThroughChange,
  isLargeChange,
  remapDecorations,
  addDecoration,
  setDecorations,
  type MarkDecoration,
  type LineDecoration,
} from './decoration.ts';

import type { Decoration, WidgetDecoration } from './types.ts';

describe('findEdit', () => {
  test('empty string → insertion', () => {
    expect(findEdit('', 'abc')).toEqual({ start: 0, removed: 0, inserted: 3 });
  });

  test('insertion in the middle', () => {
    expect(findEdit('hello', 'helloXY')).toEqual({ start: 5, removed: 0, inserted: 2 });
  });

  test('deletion from end', () => {
    expect(findEdit('hello', 'hel')).toEqual({ start: 3, removed: 2, inserted: 0 });
  });

  test('deletion from middle', () => {
    expect(findEdit('abcde', 'abe')).toEqual({ start: 2, removed: 2, inserted: 0 });
  });

  test('replacement in middle', () => {
    // 'abcde' → 'abXYZe': prefix 'ab' (start=2), suffix 'e' (removed=2, inserted=3)
    expect(findEdit('abcde', 'abXYZe')).toEqual({ start: 2, removed: 2, inserted: 3 });
  });

  test('no change', () => {
    expect(findEdit('same', 'same')).toEqual({ start: 4, removed: 0, inserted: 0 });
  });

  test('full replacement', () => {
    expect(findEdit('abc', 'xyz')).toEqual({ start: 0, removed: 3, inserted: 3 });
  });
});

describe('mapDecorationsThroughChange', () => {
  function mark(id: string, from: number, to: number): Decoration {
    return { id, type: 'mark', from, to };
  }

  function line(id: string, lineNum: number): Decoration {
    return { id, type: 'line', line: lineNum };
  }

  function widget(id: string, offset: number): WidgetDecoration {
    return { id, type: 'widget', offset, create: () => document.createElement('span') };
  }

  test('mark before the edit is unchanged', () => {
    const result = mapDecorationsThroughChange(
      [mark('d1', 0, 3)],
      'hello world',
      // insert X at offset 6
      'hello Xworld',
    );
    const d = result[0] as MarkDecoration;

    expect(d.from).toBe(0);
    expect(d.to).toBe(3);
  });

  test('mark after the edit shifts by delta', () => {
    const result = mapDecorationsThroughChange(
      [mark('d1', 6, 11)],
      'hello world',
      // insert X at offset 6, delta +1
      'hello Xworld',
    );
    const d = result[0] as MarkDecoration;

    expect(d.from).toBe(7);
    expect(d.to).toBe(12);
  });

  test('mark entirely inside a deletion is removed', () => {
    const result = mapDecorationsThroughChange(
      [mark('d1', 2, 4)],
      'hello',

      // delete 'ell' (offset 1–4)
      'ho',
    );

    expect(result).toHaveLength(0);
  });

  test('mark spanning the edit region expands/contracts to cover inserted text', () => {
    // 'hello world' → 'hello BIGWORLD': replace 'world' (6-11) with 'BIGWORLD' (delta +3)
    const result = mapDecorationsThroughChange(
      [mark('d1', 6, 11)],
      'hello world',
      'hello BIGWORLD',
    );
    const d = result[0] as MarkDecoration;

    expect(d.from).toBe(6);
    expect(d.to).toBe(14);
  });

  test('line decoration before the edit is unchanged', () => {
    const result = mapDecorationsThroughChange(
      [line('d1', 1)],
      'a\nb\nc',

      // insert 'new\n' before 'b'
      'a\nnew\nb\nc',
    );
    const d = result[0] as LineDecoration;

    expect(d.line).toBe(1);
  });

  test('line decoration after inserted lines shifts down', () => {
    const result = mapDecorationsThroughChange(
      [line('d1', 3)],
      'a\nb\nc',

      // insert one line before 'b', lineDelta +1
      'a\nnew\nb\nc',
    );
    const d = result[0] as LineDecoration;

    expect(d.line).toBe(4);
  });

  test('line decoration after deleted lines shifts up', () => {
    const result = mapDecorationsThroughChange(
      [line('d1', 4)],
      'a\nb\nc\nd\ne',

      // delete line 2 ('b\n'), lineDelta -1
      'a\nc\nd\ne',
    );
    const d = result[0] as LineDecoration;

    expect(d.line).toBe(3);
  });

  test('line decoration in the deleted range is removed', () => {
    const result = mapDecorationsThroughChange(
      [line('d1', 2)],
      'a\nb\nc',

      // delete 'b\n' (line 2)
      'a\nc',
    );

    expect(result).toHaveLength(0);
  });

  test('widget before the edit is unchanged', () => {
    const result = mapDecorationsThroughChange(
      [widget('w1', 2)],
      'hello',

      // insert X at offset 3
      'helXlo',
    );
    const w = result[0] as WidgetDecoration;

    expect(w.offset).toBe(2);
  });

  test('widget after the edit shifts by delta', () => {
    const result = mapDecorationsThroughChange(
      [widget('w1', 5)],
      'hello',

      // insert XX at offset 3, delta +2
      'helXXlo',
    );
    const w = result[0] as WidgetDecoration;

    expect(w.offset).toBe(7);
  });
});

describe('isLargeChange', () => {
  test('deleting more than 50 chars is a large change', () => {
    const text = 'a'.repeat(60);
    const edit = findEdit(text, '');

    expect(isLargeChange(text, edit)).toBe(true);
  });

  test('removing more than 50% of the document is a large change', () => {
    // 120-char doc, remove 65 chars: 65 > 50 ✓ and 65 > 60 (50% of 120) ✓
    const text = 'a'.repeat(120);
    const edit = findEdit(text, 'a'.repeat(55));

    expect(isLargeChange(text, edit)).toBe(true);
  });

  test('single-character insertion is not a large change', () => {
    const edit = findEdit('hello', 'helllo');

    expect(isLargeChange('hello', edit)).toBe(false);
  });

  test('empty document edit is not a large change', () => {
    const edit = findEdit('', 'a');

    expect(isLargeChange('', edit)).toBe(false);
  });

  test('large insertion into empty string is not a large change', () => {
    // changeSize > 50 but NOT > 50% of oldValue.length (0)
    const edit = findEdit('', 'a'.repeat(60));

    expect(isLargeChange('', edit)).toBe(false);
  });
});

describe('remapDecorations', () => {
  test('returns mapped decorations for small changes', () => {
    const decs: Decoration[] = [{ id: 'd1', type: 'mark', from: 6, to: 11 }];
    const result = remapDecorations(decs, 'hello world', 'hello Xworld');

    expect(result).toHaveLength(1);
    expect((result[0] as MarkDecoration).from).toBe(7);
    expect((result[0] as MarkDecoration).to).toBe(12);
  });

  test('returns empty array for large changes', () => {
    const text = 'a'.repeat(120);
    const decs: Decoration[] = [{ id: 'd1', type: 'mark', from: 0, to: 5 }];
    const result = remapDecorations(decs, text, 'a'.repeat(55));

    expect(result).toHaveLength(0);
  });

  test('preserves decorations before the edit untouched', () => {
    const decs: Decoration[] = [{ id: 'd1', type: 'mark', from: 0, to: 3 }];
    const result = remapDecorations(decs, 'hello', 'helXlo');

    expect(result).toHaveLength(1);
    expect((result[0] as MarkDecoration).from).toBe(0);
  });
});

describe('addDecoration', () => {
  test('returns a unique string id', () => {
    const map = new Map<string, Decoration>();
    const id = addDecoration(map, { type: 'mark', from: 0, to: 5 });

    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
    expect(map.has(id)).toBe(true);
  });

  test('each call produces a distinct id', () => {
    const map = new Map<string, Decoration>();
    const id1 = addDecoration(map, { type: 'mark', from: 0, to: 3 });
    const id2 = addDecoration(map, { type: 'mark', from: 4, to: 7 });

    expect(id1).not.toBe(id2);
    expect(map.size).toBe(2);
  });

  test('stored decoration has the assigned id and original properties', () => {
    const map = new Map<string, Decoration>();
    const id = addDecoration(map, { type: 'mark', from: 2, to: 8, className: 'hi' });
    const stored = map.get(id) as MarkDecoration;

    expect(stored.id).toBe(id);
    expect(stored.from).toBe(2);
    expect(stored.to).toBe(8);
    expect(stored.className).toBe('hi');
  });
});

describe('setDecorations', () => {
  test('replaces all existing decorations with new ones', () => {
    const map = new Map<string, Decoration>();

    addDecoration(map, { type: 'mark', from: 0, to: 3 });
    setDecorations(map, [
      { type: 'mark', from: 4, to: 7 },
      { type: 'mark', from: 8, to: 11 },
    ]);

    expect(map.size).toBe(2);
  });

  test('setDecorations with empty array clears all', () => {
    const map = new Map<string, Decoration>();

    addDecoration(map, { type: 'mark', from: 0, to: 3 });
    setDecorations(map, []);

    expect(map.size).toBe(0);
  });

  test('each new decoration gets a unique id', () => {
    const map = new Map<string, Decoration>();

    setDecorations(map, [
      { type: 'mark', from: 0, to: 3 },
      { type: 'mark', from: 4, to: 7 },
    ]);
    const ids = [...map.keys()];

    expect(ids[0]).not.toBe(ids[1]);
  });
});
