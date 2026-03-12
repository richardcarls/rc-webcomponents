import { test, expect, describe, vi } from 'vitest';
import { createLineDecoratorPlugin } from './line-decorator.ts';
import type { LineDecoratorPlugin, DecorationInput, RCTextareaPluginAPI } from './types.ts';

// Minimal mock of RCTextareaPluginAPI
function makeApi(overrides: Partial<RCTextareaPluginAPI> = {}): RCTextareaPluginAPI {
  return {
    host: document.createElement('div'),
    value: '',
    selectionStart: 0,
    selectionEnd: 0,
    getCursorRect: () => null,
    getWordAtCursor: () => null,
    onCursorMove: () => () => {},
    addDecoration: () => '',
    removeDecoration: () => {},
    clearDecorations: () => {},
    setDecorations: () => {},
    scheduleUpdate: () => {},
    adoptStyleSheet: () => new CSSStyleSheet(),
    removeStyleSheet: () => {},
    decorationsFromHtml: () => [],
    decorationsFromTokens: () => [],
    insertText: () => {},
    wrapSelection: () => {},
    replaceSelection: () => {},
    ...overrides,
  };
}

describe('createLineDecoratorPlugin', () => {
  // ── offset conversion ─────────────────────────────────────────────────

  test('line-relative mark offsets are converted to absolute document offsets', () => {
    const received: DecorationInput[][] = [];
    const api = makeApi({ setDecorations: (d) => received.push(d) });

    const decorator: LineDecoratorPlugin = {
      decorateLine: (line) =>
        line === 'hello'
          ? [{ type: 'mark', from: 1, to: 4, className: 'a' }]
          : [],
    };

    const plugin = createLineDecoratorPlugin(decorator);
    plugin.mount!(api);
    plugin.update!('hello\nworld', api);

    expect(received).toHaveLength(1);
    expect(received[0]).toHaveLength(1);
    expect(received[0][0]).toMatchObject({ type: 'mark', from: 1, to: 4 });
  });

  test('mark offsets on the second line are shifted by line length + 1', () => {
    const received: DecorationInput[][] = [];
    const api = makeApi({ setDecorations: (d) => received.push(d) });

    const decorator: LineDecoratorPlugin = {
      decorateLine: (line) =>
        line === 'world'
          ? [{ type: 'mark', from: 0, to: 5, className: 'b' }]
          : [],
    };

    const plugin = createLineDecoratorPlugin(decorator);
    plugin.mount!(api);
    plugin.update!('hello\nworld', api);

    expect(received[0][0]).toMatchObject({ type: 'mark', from: 6, to: 11 });
  });

  test('lineIndex is 0-based and passed correctly', () => {
    const indices: number[] = [];
    const decorator: LineDecoratorPlugin = {
      decorateLine: (_line, i) => { indices.push(i); return []; },
    };

    const plugin = createLineDecoratorPlugin(decorator);
    plugin.mount!(makeApi());
    plugin.update!('a\nb\nc', makeApi());

    expect(indices).toEqual([0, 1, 2]);
  });

  test('LineDecoration (type: line) is passed through unchanged', () => {
    const received: DecorationInput[][] = [];
    const api = makeApi({ setDecorations: (d) => received.push(d) });

    const decorator: LineDecoratorPlugin = {
      decorateLine: (_line, i) =>
        i === 1
          ? [{ type: 'line', line: 2, message: 'error here', className: 'err' }]
          : [],
    };

    const plugin = createLineDecoratorPlugin(decorator);
    plugin.mount!(api);
    plugin.update!('ok\nbad', api);

    expect(received[0]).toHaveLength(1);
    expect(received[0][0]).toMatchObject({ type: 'line', line: 2, message: 'error here' });
  });

  // ── CSS injection ─────────────────────────────────────────────────────

  test('styles are adopted on mount when provided', () => {
    const adopted: (CSSStyleSheet | string)[] = [];
    const api = makeApi({ adoptStyleSheet: (s) => { adopted.push(s); return new CSSStyleSheet(); } });

    const decorator: LineDecoratorPlugin = {
      styles: '.foo { color: red; }',
      decorateLine: () => [],
    };

    createLineDecoratorPlugin(decorator).mount!(api);
    expect(adopted).toHaveLength(1);
    expect(adopted[0]).toBe('.foo { color: red; }');
  });

  test('no adoptStyleSheet call when styles is undefined', () => {
    const adopted: unknown[] = [];
    const api = makeApi({ adoptStyleSheet: (s) => { adopted.push(s); return new CSSStyleSheet(); } });

    createLineDecoratorPlugin({ decorateLine: () => [] }).mount!(api);
    expect(adopted).toHaveLength(0);
  });

  // ── extraDecorations ──────────────────────────────────────────────────

  test('extraDecorations are appended after line decorations', () => {
    const received: DecorationInput[][] = [];
    const api = makeApi({ setDecorations: (d) => received.push(d) });

    const plugin = createLineDecoratorPlugin(
      { decorateLine: () => [{ type: 'mark', from: 0, to: 1, className: 'a' }] },
      { extraDecorations: () => [{ type: 'line', line: 1, message: 'extra' }] },
    );

    plugin.mount!(api);
    plugin.update!('x', api);

    expect(received[0]).toHaveLength(2);
    expect(received[0][0]).toMatchObject({ type: 'mark' });
    expect(received[0][1]).toMatchObject({ type: 'line', message: 'extra' });
  });

  // ── watch / subscriptions ────────────────────────────────────────────

  test('watch subscriber is called on mount with a scheduleUpdate callback', () => {
    const scheduled: number[] = [];
    const api = makeApi({ scheduleUpdate: () => scheduled.push(1) });

    let storedCb: (() => void) | null = null;
    const subscribe = vi.fn((cb: () => void) => { storedCb = cb; });

    const plugin = createLineDecoratorPlugin({ decorateLine: () => [] }, { watch: [subscribe] });
    plugin.mount!(api);

    expect(subscribe).toHaveBeenCalledOnce();
    storedCb!();
    expect(scheduled).toHaveLength(1);
  });

  test('watch cleanup is called on destroy', () => {
    const cleanup = vi.fn();
    const subscribe = (_cb: () => void) => cleanup;

    const plugin = createLineDecoratorPlugin({ decorateLine: () => [] }, { watch: [subscribe] });
    plugin.mount!(makeApi());
    plugin.destroy!();

    expect(cleanup).toHaveBeenCalledOnce();
  });

  test('watch cleanup is not called again after a second destroy', () => {
    const cleanup = vi.fn();
    const subscribe = (_cb: () => void) => cleanup;

    const plugin = createLineDecoratorPlugin({ decorateLine: () => [] }, { watch: [subscribe] });
    plugin.mount!(makeApi());
    plugin.destroy!();
    plugin.destroy!();

    expect(cleanup).toHaveBeenCalledOnce();
  });

  test('multiple watch subscribers are all set up and cleaned up', () => {
    const cleanups = [vi.fn(), vi.fn()];
    const subs = cleanups.map(c => (_cb: () => void) => c);

    const plugin = createLineDecoratorPlugin({ decorateLine: () => [] }, { watch: subs });
    plugin.mount!(makeApi());
    plugin.destroy!();

    expect(cleanups[0]).toHaveBeenCalledOnce();
    expect(cleanups[1]).toHaveBeenCalledOnce();
  });
});
