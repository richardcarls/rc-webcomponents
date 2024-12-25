import { test, expect, describe } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './rc-textarea.ts';
import type { RCTextarea } from './rc-textarea.ts';
import { getMirror, getGutter, getLineNumbers, getSlottedTextarea, waitRAF } from './test-helpers.ts';

/**
 * Cast helper for accessing the internal Decoration API in tests.
 * These methods are protected on RCTextarea and are not part of the public
 * consumer API.
 */
function deco(el: RCTextarea) {
  return el as any as {
    addDecoration(d: any): string;
    removeDecoration(id: string): void;
    updateDecoration(id: string, patch: any): void;
    clearDecorations(): void;
    setDecorations(decorations: any[]): void;
  };
}

describe('RCTextarea internal decoration API', () => {
  describe('decorations', () => {
    test('addDecoration returns an id', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello world</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const id = deco(host).addDecoration({
        type: 'mark',
        range: { from: 0, to: 5 },
        className: 'test-mark',
      });

      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    test('mark decoration renders span in mirror', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello world</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      deco(host).addDecoration({
        type: 'mark',
        range: { from: 0, to: 5 },
        className: 'test-mark',
      });
      await waitRAF();

      const mirror = getMirror(host);
      const span = mirror.querySelector('.test-mark');
      expect(span).not.toBeNull();
      expect(span?.textContent).toBe('hello');
    });

    test('removeDecoration removes span from mirror', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello world</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      const id = deco(host).addDecoration({
        type: 'mark',
        range: { from: 0, to: 5 },
        className: 'test-mark',
      });
      await waitRAF();

      deco(host).removeDecoration(id);
      await waitRAF();

      expect(getMirror(host).querySelector('.test-mark')).toBeNull();
    });

    test('clearDecorations removes all spans', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello world foo</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      deco(host).addDecoration({ type: 'mark', range: { from: 0, to: 5 }, className: 'a' });
      deco(host).addDecoration({ type: 'mark', range: { from: 6, to: 11 }, className: 'b' });
      await waitRAF();

      deco(host).clearDecorations();
      await waitRAF();

      expect(getMirror(host).querySelector('.a')).toBeNull();
      expect(getMirror(host).querySelector('.b')).toBeNull();
    });
  });

  // ─── Public API methods (previously untested) ──────────────────────────────

  describe('updateDecoration', () => {
    test('updateDecoration changes the className of an existing mark', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello world</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      const id = deco(host).addDecoration({ type: 'mark', range: { from: 0, to: 5 }, className: 'old-class' });
      await waitRAF();
      expect(getMirror(host).querySelector('.old-class')).not.toBeNull();

      deco(host).updateDecoration(id, { className: 'new-class' });
      await waitRAF();

      expect(getMirror(host).querySelector('.old-class')).toBeNull();
      expect(getMirror(host).querySelector('.new-class')).not.toBeNull();
    });

    test('updateDecoration changes the range of an existing mark', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello world</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      const id = deco(host).addDecoration({ type: 'mark', range: { from: 0, to: 5 }, className: 'mark' });
      await waitRAF();
      expect(getMirror(host).querySelector('.mark')?.textContent).toBe('hello');

      deco(host).updateDecoration(id, { range: { from: 6, to: 11 } });
      await waitRAF();
      expect(getMirror(host).querySelector('.mark')?.textContent).toBe('world');
    });

    test('updateDecoration on unknown id is a no-op', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      // Should not throw
      deco(host).updateDecoration('nonexistent', { className: 'noop' });
    });
  });

  describe('setDecorations', () => {
    test('setDecorations replaces all existing decorations atomically', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello world foo</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      deco(host).addDecoration({ type: 'mark', range: { from: 0, to: 5 }, className: 'old' });
      await waitRAF();
      expect(getMirror(host).querySelector('.old')).not.toBeNull();

      deco(host).setDecorations([
        { type: 'mark', range: { from: 6, to: 11 }, className: 'new1' },
        { type: 'mark', range: { from: 12, to: 15 }, className: 'new2' },
      ]);
      await waitRAF();

      expect(getMirror(host).querySelector('.old')).toBeNull();
      expect(getMirror(host).querySelector('.new1')).not.toBeNull();
      expect(getMirror(host).querySelector('.new2')).not.toBeNull();
    });

    test('setDecorations with empty array clears all decorations', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello world</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      deco(host).addDecoration({ type: 'mark', range: { from: 0, to: 5 }, className: 'mark' });
      await waitRAF();

      deco(host).setDecorations([]);
      await waitRAF();

      expect(getMirror(host).querySelector('.mark')).toBeNull();
    });
  });

  // ─── Line decorations ──────────────────────────────────────────────────────

  describe('line decorations', () => {
    test('line decoration applies className to the correct line div', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      host.value = 'first\nsecond\nthird';
      await waitRAF();

      deco(host).addDecoration({ type: 'line', line: 2, className: 'highlighted' });
      await waitRAF();

      const lines = getMirror(host).querySelectorAll('.line');
      expect(lines[1].classList.contains('highlighted')).toBe(true);
      expect(lines[0].classList.contains('highlighted')).toBe(false);
      expect(lines[2].classList.contains('highlighted')).toBe(false);
    });

    test('line decoration renders attributes onto the line div', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      host.value = 'line one\nline two';
      await waitRAF();

      deco(host).addDecoration({
        type: 'line',
        line: 1,
        attributes: { 'data-testattr': 'abc' },
      });
      await waitRAF();

      const firstLine = getMirror(host).querySelectorAll('.line')[0];
      expect(firstLine.getAttribute('data-testattr')).toBe('abc');
    });

    test('out-of-bounds line decoration does not crash', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>just one line</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      // Line 99 does not exist — should not throw
      deco(host).addDecoration({ type: 'line', line: 99, className: 'ghost' });
      await waitRAF();

      expect(getMirror(host).querySelector('.ghost')).toBeNull();
    });

    test('line decoration can be combined with a mark decoration on the same line', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      host.value = 'hello world';
      await waitRAF();

      deco(host).addDecoration({ type: 'line', line: 1, className: 'line-hl' });
      deco(host).addDecoration({ type: 'mark', range: { from: 0, to: 5 }, className: 'word-hl' });
      await waitRAF();

      const mirror = getMirror(host);
      const line1 = mirror.querySelector('.line');
      expect(line1!.classList.contains('line-hl')).toBe(true);
      expect(line1!.querySelector('.word-hl')).not.toBeNull();
    });

    test('removeDecoration removes a line decoration', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>line one\nline two</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      host.value = 'line one\nline two';
      await waitRAF();

      const id = deco(host).addDecoration({ type: 'line', line: 1, className: 'to-remove' });
      await waitRAF();
      expect(getMirror(host).querySelector('.to-remove')).not.toBeNull();

      deco(host).removeDecoration(id);
      await waitRAF();
      expect(getMirror(host).querySelector('.to-remove')).toBeNull();
    });

    test('updateDecoration changes the line number of a line decoration', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      host.value = 'first\nsecond\nthird';
      await waitRAF();

      const id = deco(host).addDecoration({ type: 'line', line: 1, className: 'movable' });
      await waitRAF();

      let lines = getMirror(host).querySelectorAll('.line');
      expect(lines[0].classList.contains('movable')).toBe(true);

      deco(host).updateDecoration(id, { line: 3 });
      await waitRAF();

      lines = getMirror(host).querySelectorAll('.line');
      expect(lines[0].classList.contains('movable')).toBe(false);
      expect(lines[2].classList.contains('movable')).toBe(true);
    });
  });

  // ─── Widget decorations ────────────────────────────────────────────────────

  describe('widget decorations', () => {
    // Convention: the decoration range must include a U+2007 FIGURE SPACE character.
    // 'before': figure-space is range[0]; widget renders before remaining text.
    // 'after':  figure-space is range[to-1]; widget renders after preceding text.

    test('widgetPlacement "before" renders widget before text, figure-space not in textContent', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      // value: figure-space then "hello world"
      host.value = '\u2007hello world';
      await waitRAF();

      deco(host).addDecoration({
        type: 'mark',
        range: { from: 0, to: 6 }, // '\u2007hello'
        className: 'marked',
        widgetPlacement: 'before',
        createWidget: () => {
          const el = document.createElement('span');
          el.className = 'my-widget';
          el.textContent = '→';
          return el;
        },
      });
      await waitRAF();

      const mirror = getMirror(host);
      // Widget host must be present
      const widgetHost = mirror.querySelector('.rc-widget-host');
      expect(widgetHost).not.toBeNull();
      expect(widgetHost!.querySelector('.my-widget')).not.toBeNull();
      // The figure-space must NOT appear as text in the mirror
      expect(mirror.textContent).not.toContain('\u2007');
      // The text after the figure-space is in a styled span
      expect(mirror.querySelector('.marked')?.textContent).toBe('hello');
    });

    test('widgetPlacement "after" renders widget after text, figure-space not in textContent', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      // value: "hello" then figure-space
      host.value = 'hello\u2007 world';
      await waitRAF();

      deco(host).addDecoration({
        type: 'mark',
        range: { from: 0, to: 6 }, // 'hello\u2007'
        className: 'marked',
        widgetPlacement: 'after',
        createWidget: () => {
          const el = document.createElement('span');
          el.className = 'after-widget';
          return el;
        },
      });
      await waitRAF();

      const mirror = getMirror(host);
      expect(mirror.querySelector('.rc-widget-host')).not.toBeNull();
      expect(mirror.querySelector('.after-widget')).not.toBeNull();
      // The figure-space must NOT appear as text in the mirror
      expect(mirror.textContent).not.toContain('\u2007');
      // The text before the figure-space is in a styled span
      expect(mirror.querySelector('.marked')?.textContent).toBe('hello');
    });

    test('standalone widget (1-char figure-space range) renders widget without text span', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      host.value = 'foo\u2007bar';
      await waitRAF();

      deco(host).addDecoration({
        type: 'mark',
        range: { from: 3, to: 4 }, // just the figure-space
        widgetPlacement: 'before',
        createWidget: () => {
          const el = document.createElement('span');
          el.className = 'solo-widget';
          return el;
        },
      });
      await waitRAF();

      const mirror = getMirror(host);
      expect(mirror.querySelector('.rc-widget-host')).not.toBeNull();
      expect(mirror.querySelector('.solo-widget')).not.toBeNull();
      expect(mirror.textContent).not.toContain('\u2007');
    });

    test('pattern createWidget is called with the RegExpMatchArray', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      host.value = 'user@example.com';
      await waitRAF();

      let capturedMatch: RegExpMatchArray | null = null;
      host.addPattern({
        pattern: /\w+@\w+\.\w+/g,
        widgetPlacement: 'before',
        createWidget: (match) => {
          capturedMatch = match;
          const el = document.createElement('span');
          return el;
        },
      });
      await waitRAF();

      expect(capturedMatch).not.toBeNull();
      expect(capturedMatch![0]).toBe('user@example.com');
    });
  });

  // ─── Decoration edge cases ─────────────────────────────────────────────────

  describe('decoration edge cases', () => {
    test('overlapping marks both apply their classNames', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      deco(host).addDecoration({ type: 'mark', range: { from: 0, to: 5 }, className: 'a' });
      deco(host).addDecoration({ type: 'mark', range: { from: 0, to: 5 }, className: 'b' });
      await waitRAF();

      const mirror = getMirror(host);
      expect(mirror.querySelector('.a')).not.toBeNull();
      expect(mirror.querySelector('.b')).not.toBeNull();
    });

    test('mark attributes are rendered onto the span element', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      deco(host).addDecoration({
        type: 'mark',
        range: { from: 0, to: 5 },
        className: 'attr-mark',
        attributes: { 'data-kind': 'keyword', title: 'built-in' },
      });
      await waitRAF();

      const span = getMirror(host).querySelector('.attr-mark');
      expect(span).not.toBeNull();
      expect(span!.getAttribute('data-kind')).toBe('keyword');
      expect(span!.getAttribute('title')).toBe('built-in');
    });

    test('out-of-range mark decoration does not crash', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      // Range beyond document length
      deco(host).addDecoration({ type: 'mark', range: { from: 100, to: 200 }, className: 'oob' });
      await waitRAF();

      expect(getMirror(host).querySelector('.oob')).toBeNull();
    });
  });

  describe('large-change decoration clearing', () => {
    test('decorations are cleared on paste-scale input changes', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>short text</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      deco(host).addDecoration({
        type: 'mark',
        range: { from: 0, to: 5 },
        className: 'test-mark',
      });
      await waitRAF();

      // Simulate a large paste replacing most content
      const textarea = getSlottedTextarea(host);
      textarea.value = 'A'.repeat(500); // Large replacement
      textarea.dispatchEvent(new InputEvent('input'));
      await waitRAF();

      // Decoration should have been cleared
      expect(getMirror(host).querySelector('.test-mark')).toBeNull();
    });
  });

  // ─── Additional edge cases ─────────────────────────────────────────────────

  describe('additional decoration edge cases', () => {
    test('createWidget returning null does not crash and text still renders', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      // figure-space then "hello world"
      host.value = '\u2007hello world';
      await waitRAF();

      // createWidget returning null — renderer must not crash
      deco(host).addDecoration({
        type: 'mark',
        range: { from: 0, to: 6 }, // '\u2007hello'
        className: 'marked',
        widgetPlacement: 'before',
        createWidget: () => null as unknown as HTMLElement,
      });
      await waitRAF();

      // No crash, no widget host (null factory)
      expect(getMirror(host).querySelector('.rc-widget-host')).toBeNull();
      // The text span is still rendered for the content after the figure-space
      expect(getMirror(host).querySelector('.marked')).not.toBeNull();
      expect(getMirror(host).querySelector('.marked')?.textContent).toBe('hello');
    });

    test('adjacent (touching but non-overlapping) marks both render', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello world</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      // [0,5) = "hello"  [5,11) = " world"
      deco(host).addDecoration({ type: 'mark', range: { from: 0, to: 5 }, className: 'word-a' });
      deco(host).addDecoration({ type: 'mark', range: { from: 5, to: 11 }, className: 'word-b' });
      await waitRAF();

      const mirror = getMirror(host);
      expect(mirror.querySelector('.word-a')?.textContent).toBe('hello');
      expect(mirror.querySelector('.word-b')?.textContent).toBe(' world');
    });

    test('cross-line mark range does not crash', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      host.value = 'line one\nline two';
      await waitRAF();

      // Range spans across the newline boundary (offset 4 on line 1, offset 4 on line 2)
      deco(host).addDecoration({ type: 'mark', range: { from: 4, to: 13 }, className: 'cross' });
      await waitRAF();

      // Must not crash; some span(s) with the class should appear
      expect(getMirror(host).querySelector('.cross')).not.toBeNull();
    });
  });
});
