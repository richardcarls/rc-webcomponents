import { test, expect, describe, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './rc-textarea.ts';
import type { RCTextarea } from './rc-textarea.ts';
import { getMirror, getGutter, getLineNumbers, getDiagnosticStatus, getSlottedTextarea, waitRAF } from './test-helpers.ts';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RCTextarea', () => {
  describe('basic rendering and ARIA', () => {
    test('renders with slotted textarea', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>Hello world</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const mirror = getMirror(host);
      expect(mirror).not.toBeNull();
    });

    test('mirror has aria-hidden="true"', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>Test</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      expect(getMirror(host).getAttribute('aria-hidden')).toBe('true');
    });

    test('diagnostic-status has role="status"', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      expect(getDiagnosticStatus(host).getAttribute('role')).toBe('status');
      expect(getDiagnosticStatus(host).getAttribute('aria-live')).toBe('polite');
    });

    test('gutter is hidden when lineNumbers is false', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>Test</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const gutter = getGutter(host);
      const cs = getComputedStyle(gutter);
      expect(cs.display).toBe('none');
    });

    test('gutter is shown when lineNumbers is true', async () => {
      const screen = render(html`
        <rc-textarea
          data-testid="host"
          style="width: 400px; height: 200px;"
          lineNumbers
        >
          <textarea>Test</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const gutter = getGutter(host);
      const cs = getComputedStyle(gutter);
      expect(cs.display).not.toBe('none');
    });
  });

  describe('value sync', () => {
    test('get value returns textarea.value', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>initial content</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      expect(host.value).toBe('initial content');
    });

    test('set value updates textarea and re-renders mirror', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      host.value = 'new content';
      await waitRAF();

      expect(getSlottedTextarea(host).value).toBe('new content');
      expect(getMirror(host).innerHTML).toContain('new content');
    });

    test('mirror updates on input event', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const textarea = getSlottedTextarea(host);
      textarea.value = 'typed text';
      textarea.dispatchEvent(new InputEvent('input'));
      await waitRAF();

      expect(getMirror(host).innerHTML).toContain('typed text');
    });
  });

  describe('line numbers', () => {
    test('gutter shows correct line count', async () => {
      const screen = render(html`
        <rc-textarea
          data-testid="host"
          style="width: 400px; height: 200px;"
          lineNumbers
        >
          <textarea>line1\nline2\nline3</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      // Template literal doesn't interpret \n — the textarea has 1 line here.
      // Let's set the value explicitly.
      host.value = 'line1\nline2\nline3';
      await waitRAF();

      const lineNumbers = getLineNumbers(host);
      const items = lineNumbers.querySelectorAll('.line-number');
      expect(items.length).toBe(3);
      expect(items[0].textContent).toBe('1');
      expect(items[2].textContent).toBe('3');
    });

    test('gutter updates when lines are added', async () => {
      const screen = render(html`
        <rc-textarea
          data-testid="host"
          style="width: 400px; height: 200px;"
          lineNumbers
        >
          <textarea>one</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      host.value = 'one\ntwo\nthree\nfour';
      await waitRAF();

      const items = getLineNumbers(host).querySelectorAll('.line-number');
      expect(items.length).toBe(4);
    });
  });

  describe('diagnostics', () => {
    test('addDiagnostic renders inline diagnostic span', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>line one\nline two</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      host.value = 'line one\nline two';
      await waitRAF();

      host.addDiagnostic({
        line: 1,
        severity: 'error',
        message: 'Something went wrong',
      });
      await waitRAF();

      const mirror = getMirror(host);
      const diag = mirror.querySelector('.diagnostic--error');
      expect(diag).not.toBeNull();
      expect(diag?.textContent).toContain('Something went wrong');
    });

    test('ARIA live region updates when diagnostics are added', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>some code</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      host.setDiagnostics([
        { line: 1, severity: 'warning', message: 'Unused variable' },
      ]);
      await waitRAF();

      const status = getDiagnosticStatus(host);
      expect(status.textContent).toContain('Unused variable');
      expect(status.textContent).toContain('warning');
    });

    test('clearDiagnostics empties live region', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>code</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      host.addDiagnostic({ line: 1, severity: 'error', message: 'Oops' });
      host.clearDiagnostics();

      expect(getDiagnosticStatus(host).textContent).toBe('');
    });
  });

  describe('pattern matching', () => {
    test('addPattern generates mark decorations', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello world</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      host.addPattern({ pattern: /world/g, className: 'pattern-match' });
      await waitRAF();

      const span = getMirror(host).querySelector('.pattern-match');
      expect(span).not.toBeNull();
      expect(span?.textContent).toBe('world');
    });

    test('pattern decorations update on input', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>no match here</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      host.addPattern({ pattern: /\d+/g, className: 'num' });
      await waitRAF();

      // No numbers yet
      expect(getMirror(host).querySelector('.num')).toBeNull();

      // Now add a number
      const textarea = getSlottedTextarea(host);
      textarea.value = 'count: 42';
      textarea.dispatchEvent(new InputEvent('input'));
      await waitRAF();

      expect(getMirror(host).querySelector('.num')).not.toBeNull();
    });

    test('removePattern stops generating decorations', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello 123</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      const id = host.addPattern({ pattern: /\d+/g, className: 'num' });
      await waitRAF();

      expect(getMirror(host).querySelector('.num')).not.toBeNull();

      host.removePattern(id);
      await waitRAF();

      expect(getMirror(host).querySelector('.num')).toBeNull();
    });
  });

  describe('events', () => {
    test('dispatches rc-textarea-change on input', async () => {
      const handleChange = vi.fn() as unknown as EventListener;

      const screen = render(html`
        <rc-textarea
          data-testid="host"
          style="width: 400px; height: 200px;"
          @rc-textarea-change=${handleChange}
        >
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const textarea = getSlottedTextarea(host);
      textarea.value = 'typed';
      textarea.dispatchEvent(new InputEvent('input'));

      expect(handleChange).toHaveBeenCalledOnce();
      const event = (handleChange as ReturnType<typeof vi.fn>).mock.calls[0][0] as CustomEvent<{ value: string }>;
      expect(event.detail.value).toBe('typed');
    });

    test('dispatches rc-textarea-focus on focus', async () => {
      const handleFocus = vi.fn() as unknown as EventListener;

      const screen = render(html`
        <rc-textarea
          data-testid="host"
          style="width: 400px; height: 200px;"
          @rc-textarea-focus=${handleFocus}
        >
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      getSlottedTextarea(host).dispatchEvent(new FocusEvent('focus'));

      expect(handleFocus).toHaveBeenCalledOnce();
    });

    test('dispatches rc-textarea-blur on blur', async () => {
      const handleBlur = vi.fn() as unknown as EventListener;

      const screen = render(html`
        <rc-textarea
          data-testid="host"
          style="width: 400px; height: 200px;"
          @rc-textarea-blur=${handleBlur}
        >
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      getSlottedTextarea(host).dispatchEvent(new FocusEvent('blur'));

      expect(handleBlur).toHaveBeenCalledOnce();
    });

    test('dispatches rc-textarea-select with selection range', async () => {
      const handleSelect = vi.fn() as unknown as EventListener;

      const screen = render(html`
        <rc-textarea
          data-testid="host"
          style="width: 400px; height: 200px;"
          @rc-textarea-select=${handleSelect}
        >
          <textarea>hello world</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const textarea = getSlottedTextarea(host);
      textarea.setSelectionRange(0, 5);
      textarea.dispatchEvent(new Event('select'));

      expect(handleSelect).toHaveBeenCalledOnce();
      const event = (handleSelect as ReturnType<typeof vi.fn>).mock.calls[0][0] as CustomEvent<{ selectionStart: number; selectionEnd: number }>;
      expect(event.detail.selectionStart).toBe(0);
      expect(event.detail.selectionEnd).toBe(5);
    });
  });

  describe('scroll sync', () => {
    test('mirror scrollTop syncs from textarea scroll', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 100px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      host.value = Array.from({ length: 50 }, (_, i) => `line ${i + 1}`).join('\n');
      await waitRAF();

      const textarea = getSlottedTextarea(host);
      // Manually set scrollTop and dispatch scroll event
      Object.defineProperty(textarea, 'scrollTop', { value: 50, configurable: true });
      textarea.dispatchEvent(new Event('scroll'));

      expect(getMirror(host).scrollTop).toBe(50);
    });
  });

  describe('accessibility', () => {
    test('label prop sets aria-label on slotted textarea', async () => {
      const screen = render(html`
        <rc-textarea
          data-testid="host"
          style="width: 400px; height: 200px;"
          label="Code editor"
        >
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      expect(getSlottedTextarea(host).getAttribute('aria-label')).toBe('Code editor');
    });

    test('label prop does not override existing aria-label', async () => {
      const screen = render(html`
        <rc-textarea
          data-testid="host"
          style="width: 400px; height: 200px;"
          label="Should be ignored"
        >
          <textarea aria-label="My editor"></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      expect(getSlottedTextarea(host).getAttribute('aria-label')).toBe('My editor');
    });
  });

  describe('font and typography sync', () => {
    test('mirror receives font-family from slotted textarea with non-monospace font', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea style="font-family: Arial, sans-serif;">Hello world</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const mirror = getMirror(host);
      const textarea = getSlottedTextarea(host);

      // _syncTypography copies font-family from textarea to mirror via inline style
      expect(mirror.style.fontFamily).toBe(getComputedStyle(textarea).fontFamily);
    });

    test('mirror receives font-size from slotted textarea with serif font', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea style="font-size: 18px; font-family: Georgia, serif;">Sample text</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const mirror = getMirror(host);
      const textarea = getSlottedTextarea(host);

      expect(mirror.style.fontSize).toBe(getComputedStyle(textarea).fontSize);
    });

    test('mirror receives line-height from slotted textarea', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea style="font-family: Verdana, sans-serif; line-height: 2;">Text here</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const mirror = getMirror(host);
      const textarea = getSlottedTextarea(host);

      expect(mirror.style.lineHeight).toBe(getComputedStyle(textarea).lineHeight);
    });

    test('line number count matches logical line count with proportional font', async () => {
      const screen = render(html`
        <rc-textarea
          data-testid="host"
          style="width: 400px; height: 200px;"
          lineNumbers
        >
          <textarea style="font-family: Arial, sans-serif;">Line one
Line two
Line three
Line four</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      const lineNumberEls = getLineNumbers(host).querySelectorAll('.line-number');
      const mirrorLines = getMirror(host).querySelectorAll('.line');

      expect(lineNumberEls.length).toBe(4);
      expect(lineNumberEls.length).toBe(mirrorLines.length);
    });

    test('mirror line count matches logical line count with serif font', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 600px; height: 200px;">
          <textarea style="font-family: 'Times New Roman', serif; font-size: 16px;">First line
Second line
Third line</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      const mirrorLines = getMirror(host).querySelectorAll('.line');
      expect(mirrorLines.length).toBe(3);
    });

    test('word-wrap mode sets explicit heights on line-numbers matching mirror lines for proportional font', async () => {
      const screen = render(html`
        <rc-textarea
          data-testid="host"
          style="width: 200px; height: 300px;"
          lineNumbers
          wordWrap
        >
          <textarea style="font-family: Arial, sans-serif; font-size: 14px;">This is a very long line that definitely wraps inside a narrow two-hundred pixel wide container.
Short.
Another very long line: Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod.</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      const lineNumberEls = [
        ...getLineNumbers(host).querySelectorAll<HTMLElement>('.line-number'),
      ];
      const mirrorLines = [
        ...getMirror(host).querySelectorAll<HTMLElement>('.line'),
      ];

      // Logical line count is 3 regardless of font
      expect(lineNumberEls.length).toBe(3);
      expect(lineNumberEls.length).toBe(mirrorLines.length);

      // In word-wrap mode _performUpdate measures each .line offsetHeight and
      // passes it to renderGutter, so every line-number gets an explicit height
      for (let i = 0; i < mirrorLines.length; i++) {
        const mirrorLineHeight = mirrorLines[i].offsetHeight;
        const lineNumHeight = parseFloat(lineNumberEls[i].style.height || '0');
        expect(lineNumHeight).toBe(mirrorLineHeight);
      }
    });

    test('typography sync re-runs when a new textarea is slotted', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea style="font-family: Courier New, monospace;">initial</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const mirror = getMirror(host);
      const firstFontFamily = mirror.style.fontFamily;
      expect(firstFontFamily).not.toBe('');

      // Replace slotted textarea with a different font
      host.innerHTML = '<textarea style="font-family: Arial, sans-serif;">replaced</textarea>';
      await host.updateComplete;
      await waitRAF();

      // Mirror should have updated to the new font
      const newTextarea = getSlottedTextarea(host);
      expect(getMirror(host).style.fontFamily).toBe(getComputedStyle(newTextarea).fontFamily);
    });

    test('mirror receives tab-size from slotted textarea', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea style="tab-size: 8;">Tab	test</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const mirror = getMirror(host);
      const textarea = getSlottedTextarea(host);
      expect(mirror.style.tabSize).toBe(getComputedStyle(textarea).tabSize);
    });
  });

  describe('removeDiagnostic', () => {
    test('removeDiagnostic removes the inline diagnostic span', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>some code</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      const id = host.addDiagnostic({ line: 1, severity: 'error', message: 'Oops' });
      await waitRAF();
      expect(getMirror(host).querySelector('.diagnostic--error')).not.toBeNull();

      host.removeDiagnostic(id);
      await waitRAF();
      expect(getMirror(host).querySelector('.diagnostic--error')).toBeNull();
    });

    test('removeDiagnostic clears the ARIA live region when no diagnostics remain', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>code</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const id = host.addDiagnostic({ line: 1, severity: 'warning', message: 'Watch out' });
      expect(getDiagnosticStatus(host).textContent).toContain('Watch out');

      host.removeDiagnostic(id);
      expect(getDiagnosticStatus(host).textContent).toBe('');
    });
  });

  describe('setDiagnostics', () => {
    test('setDiagnostics replaces all existing diagnostics', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>line one\nline two</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      host.value = 'line one\nline two';
      await waitRAF();

      host.addDiagnostic({ line: 1, severity: 'error', message: 'Old error' });
      await waitRAF();
      expect(getDiagnosticStatus(host).textContent).toContain('Old error');

      host.setDiagnostics([{ line: 2, severity: 'warning', message: 'New warning' }]);
      await waitRAF();

      const status = getDiagnosticStatus(host).textContent ?? '';
      expect(status).not.toContain('Old error');
      expect(status).toContain('New warning');
      expect(getMirror(host).querySelector('.diagnostic--error')).toBeNull();
      expect(getMirror(host).querySelector('.diagnostic--warning')).not.toBeNull();
    });
  });

  describe('clearPatterns (API)', () => {
    test('clearPatterns removes all pattern-generated decorations', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello 123 world 456</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      host.addPattern({ pattern: /\d+/g, className: 'num' });
      await waitRAF();
      expect(getMirror(host).querySelector('.num')).not.toBeNull();

      host.clearPatterns();
      await waitRAF();
      expect(getMirror(host).querySelector('.num')).toBeNull();
    });
  });

  describe('revealLine', () => {
    test('revealLine scrolls the editor and syncs the mirror', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 80px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      host.value = Array.from({ length: 50 }, (_, i) => `line ${i + 1}`).join('\n');
      await waitRAF();

      host.revealLine(30);

      // mirror.scrollTop is synced to textarea.scrollTop via _onScroll()
      const textarea = getSlottedTextarea(host);
      const mirror = getMirror(host);
      expect(mirror.scrollTop).toBe(textarea.scrollTop);
      expect(mirror.scrollTop).toBeGreaterThan(0);
    });

    test('revealLine(1) does not throw on empty document', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      // Should not throw
      host.revealLine(1);
    });
  });

  describe('setDecorationStyles', () => {
    test('setDecorationStyles adds a stylesheet to the shadow root', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const before = host.shadowRoot!.adoptedStyleSheets.length;
      host.setDecorationStyles('.kw { color: purple }');
      expect(host.shadowRoot!.adoptedStyleSheets.length).toBe(before + 1);
    });

    test('calling setDecorationStyles again replaces the sheet (not adds)', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      host.setDecorationStyles('.a { color: red }');
      const after1 = host.shadowRoot!.adoptedStyleSheets.length;
      host.setDecorationStyles('.a { color: blue }');
      expect(host.shadowRoot!.adoptedStyleSheets.length).toBe(after1);
    });
  });

  // ─── adoptStyleSheet / removeStyleSheet ────────────────────────────────────

  describe('adoptStyleSheet / removeStyleSheet', () => {
    test('adoptStyleSheet adds a sheet to adoptedStyleSheets', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const sheet = new CSSStyleSheet();
      sheet.replaceSync('.x { color: red }');
      const before = host.shadowRoot!.adoptedStyleSheets.length;
      host.adoptStyleSheet(sheet);
      expect(host.shadowRoot!.adoptedStyleSheets.length).toBe(before + 1);
      expect(host.shadowRoot!.adoptedStyleSheets).toContain(sheet);
    });

    test('adoptStyleSheet is a no-op if sheet already adopted', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const sheet = new CSSStyleSheet();
      host.adoptStyleSheet(sheet);
      const afterFirst = host.shadowRoot!.adoptedStyleSheets.length;
      host.adoptStyleSheet(sheet);
      expect(host.shadowRoot!.adoptedStyleSheets.length).toBe(afterFirst);
    });

    test('removeStyleSheet removes a previously adopted sheet', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const sheet = new CSSStyleSheet();
      host.adoptStyleSheet(sheet);
      expect(host.shadowRoot!.adoptedStyleSheets).toContain(sheet);

      host.removeStyleSheet(sheet);
      expect(host.shadowRoot!.adoptedStyleSheets).not.toContain(sheet);
    });

    test('removeStyleSheet is a no-op for unknown sheets', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const before = host.shadowRoot!.adoptedStyleSheets.length;
      const unknownSheet = new CSSStyleSheet();
      host.removeStyleSheet(unknownSheet); // not previously adopted
      expect(host.shadowRoot!.adoptedStyleSheets.length).toBe(before);
    });

    test('multiple sheets can be adopted and independently removed', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const a = new CSSStyleSheet();
      const b = new CSSStyleSheet();
      host.adoptStyleSheet(a);
      host.adoptStyleSheet(b);
      expect(host.shadowRoot!.adoptedStyleSheets).toContain(a);
      expect(host.shadowRoot!.adoptedStyleSheets).toContain(b);

      host.removeStyleSheet(a);
      expect(host.shadowRoot!.adoptedStyleSheets).not.toContain(a);
      expect(host.shadowRoot!.adoptedStyleSheets).toContain(b);
    });
  });

  // ─── Plugin API ────────────────────────────────────────────────────────────

  describe('plugin API', () => {
    test('highlight() return value is used as mirror innerHTML', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      host.usePlugin({ highlight: () => '<span class="tok">hi</span>' });
      await waitRAF();

      expect(getMirror(host).querySelector('.tok')).not.toBeNull();
    });

    test('returning null falls through to default rendering', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      host.usePlugin({ highlight: () => null });
      await waitRAF();

      // Default rendering still puts text in the mirror
      expect(getMirror(host).textContent).toContain('hello');
    });

    test('mount() is called with the plugin API on registration', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      let capturedApi: any;
      host.usePlugin({
        mount(api) { capturedApi = api; },
        highlight: () => null,
      });

      expect(capturedApi).toBeDefined();
      expect(capturedApi.host).toBe(host);
      expect(capturedApi.mirror).toBe(getMirror(host));
      expect(typeof capturedApi.escapeHtml).toBe('function');
      expect(typeof capturedApi.renderDefault).toBe('function');
      expect(typeof capturedApi.scheduleUpdate).toBe('function');
    });

    test('api.escapeHtml escapes HTML special characters', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      let api: any;
      host.usePlugin({ mount(a) { api = a; }, highlight: () => null });

      expect(api.escapeHtml('<b>&amp;</b>')).toBe('&lt;b&gt;&amp;amp;&lt;/b&gt;');
    });

    test('api.renderDefault() returns the standard pipeline HTML', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      host.addDiagnostic({ line: 1, severity: 'error', message: 'oops' });

      let api: any;
      host.usePlugin({ mount(a) { api = a; }, highlight: () => null });

      const html_ = api.renderDefault(host.value);
      expect(html_).toContain('diagnostic');
      expect(html_).toContain('oops');
    });

    test('api.diagnostics reflects addDiagnostic calls', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      host.addDiagnostic({ line: 1, severity: 'warning', message: 'watch out' });

      let api: any;
      host.usePlugin({ mount(a) { api = a; }, highlight: () => null });

      expect(api.diagnostics.length).toBe(1);
      expect(api.diagnostics[0].message).toBe('watch out');
    });

    test('highlight() is called again on each value change', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const spy = vi.fn(() => null);
      host.usePlugin({ highlight: spy });
      await waitRAF(); // called once on registration

      host.value = 'changed';
      await waitRAF(); // called again on value change

      expect(spy).toHaveBeenCalledTimes(2);
    });

    test('async highlight() result is applied to mirror', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      host.usePlugin({
        highlight: () => Promise.resolve('<em class="async-tok">hi</em>'),
      });
      await waitRAF();
      await new Promise((r) => setTimeout(r, 0)); // flush microtasks

      expect(getMirror(host).querySelector('.async-tok')).not.toBeNull();
    });

    test('stale async results are discarded when a newer update arrives', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const resolvers: ((v: string) => void)[] = [];
      host.usePlugin({
        highlight: () => new Promise<string>((res) => resolvers.push(res)),
      });

      await waitRAF(); // first render queued (resolvers[0])

      host.value = 'changed';
      await waitRAF(); // second render queued (resolvers[1])

      // Resolve first (stale) — should be discarded
      resolvers[0]('<span class="stale">stale</span>');
      await new Promise((r) => setTimeout(r, 0));
      expect(getMirror(host).querySelector('.stale')).toBeNull();

      // Resolve second (current) — should apply
      resolvers[1]('<span class="current">current</span>');
      await new Promise((r) => setTimeout(r, 0));
      expect(getMirror(host).querySelector('.current')).not.toBeNull();
    });

    test('usePlugin() replaces previous plugin and calls destroy() on old one', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const destroy = vi.fn();
      host.usePlugin({ highlight: () => null, destroy });
      host.usePlugin({ highlight: () => null });

      expect(destroy).toHaveBeenCalledOnce();
    });

    test('removePlugin() calls destroy() and restores default rendering', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const destroy = vi.fn();
      host.usePlugin({ highlight: () => '<b class="plugin-b">x</b>', destroy });
      await waitRAF();
      expect(getMirror(host).querySelector('.plugin-b')).not.toBeNull();

      host.removePlugin();
      expect(destroy).toHaveBeenCalledOnce();
      await waitRAF();
      expect(getMirror(host).querySelector('.plugin-b')).toBeNull();
      // Default rendering still shows text
      expect(getMirror(host).textContent).toContain('hello');
    });

    test('destroy() is called when the element disconnects', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const destroy = vi.fn();
      host.usePlugin({ highlight: () => null, destroy });
      host.remove();

      expect(destroy).toHaveBeenCalledOnce();
    });
  });

  // ─── Diagnostic edge cases ─────────────────────────────────────────────────

  describe('diagnostic edge cases', () => {
    test('multiple diagnostics on the same line are all rendered', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      host.value = 'line one';
      await waitRAF();

      host.addDiagnostic({ line: 1, severity: 'error', message: 'First error' });
      host.addDiagnostic({ line: 1, severity: 'warning', message: 'Second warning' });
      await waitRAF();

      const mirror = getMirror(host);
      const diags = mirror.querySelectorAll('[class*="diagnostic--"]');
      expect(diags.length).toBe(2);
    });

    test('all severity levels render with correct CSS class', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      host.value = 'a\nb\nc\nd';
      await waitRAF();

      host.setDiagnostics([
        { line: 1, severity: 'error', message: 'e' },
        { line: 2, severity: 'warning', message: 'w' },
        { line: 3, severity: 'info', message: 'i' },
        { line: 4, severity: 'hint', message: 'h' },
      ]);
      await waitRAF();

      const mirror = getMirror(host);
      expect(mirror.querySelector('.diagnostic--error')).not.toBeNull();
      expect(mirror.querySelector('.diagnostic--warning')).not.toBeNull();
      expect(mirror.querySelector('.diagnostic--info')).not.toBeNull();
      expect(mirror.querySelector('.diagnostic--hint')).not.toBeNull();
    });

    test('diagnostic createIcon factory is called and icon rendered', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>code here</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      host.addDiagnostic({
        line: 1,
        severity: 'error',
        message: 'Bad code',
        createIcon: () => {
          const el = document.createElement('span');
          el.className = 'error-icon';
          el.textContent = '✗';
          return el;
        },
      });
      await waitRAF();

      expect(getMirror(host).querySelector('.diagnostic-icon')).not.toBeNull();
      expect(getMirror(host).querySelector('.error-icon')).not.toBeNull();
    });

    test('ARIA live region lists all diagnostics with line and severity', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      host.setDiagnostics([
        { line: 2, severity: 'error', message: 'Missing semicolon' },
        { line: 5, severity: 'warning', message: 'Unused variable' },
      ]);

      const status = getDiagnosticStatus(host).textContent ?? '';
      expect(status).toContain('2 diagnostic');
      expect(status).toContain('Line 2 error: Missing semicolon');
      expect(status).toContain('Line 5 warning: Unused variable');
    });
  });

  // ─── Pattern edge cases ────────────────────────────────────────────────────

  describe('pattern edge cases', () => {
    test('multiple patterns generate independent decorations', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>count: 42 url: http://example.com</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      host.addPattern({ pattern: /\d+/g, className: 'num' });
      host.addPattern({ pattern: /https?:\/\/\S+/g, className: 'url' });
      await waitRAF();

      expect(getMirror(host).querySelector('.num')).not.toBeNull();
      expect(getMirror(host).querySelector('.url')).not.toBeNull();
    });

    test('zero-length matches are skipped without hanging', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      // Zero-length lookahead — every position would match without the guard
      host.addPattern({ pattern: /(?=\w)/g, className: 'zlm' });
      await waitRAF();

      // Zero-length matches are skipped → no decorations
      expect(getMirror(host).querySelector('.zlm')).toBeNull();
    });

    test('clearPatterns (via API) removes all pattern decorations', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello 123 world 456</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      host.addPattern({ pattern: /\d+/g, className: 'n' });
      host.addPattern({ pattern: /[a-z]+/g, className: 'w' });
      await waitRAF();
      expect(getMirror(host).querySelector('.n')).not.toBeNull();

      host.clearPatterns();
      await waitRAF();
      expect(getMirror(host).querySelector('.n')).toBeNull();
      expect(getMirror(host).querySelector('.w')).toBeNull();
    });

    test('removing a pattern while a match is active clears its decorations', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>hello world 99</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      const id = host.addPattern({ pattern: /\d+/g, className: 'num' });
      await waitRAF();
      expect(getMirror(host).querySelector('.num')).not.toBeNull();

      host.removePattern(id);
      await waitRAF();
      expect(getMirror(host).querySelector('.num')).toBeNull();
    });
  });

  // ─── Rendering and layout ──────────────────────────────────────────────────

  describe('rendering and layout', () => {
    test('HTML special characters are escaped in the mirror', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      host.value = 'a < b && c > d';
      await waitRAF();

      const mirror = getMirror(host);
      expect(mirror.innerHTML).toContain('&lt;');
      expect(mirror.innerHTML).toContain('&gt;');
      expect(mirror.innerHTML).toContain('&amp;');
      // textContent should decode back to the original characters
      expect(mirror.textContent).toContain('a < b && c > d');
    });

    test('<script> injection attempt is escaped in the mirror', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      host.value = '<script>alert("xss")</script>';
      await waitRAF();

      const mirror = getMirror(host);
      expect(mirror.querySelector('script')).toBeNull();
      expect(mirror.innerHTML).toContain('&lt;script&gt;');
    });

    test('empty document renders a single empty line with <br>', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      const mirror = getMirror(host);
      const lines = mirror.querySelectorAll('.line');
      expect(lines.length).toBe(1);
      // Empty line must contain <br> to prevent collapse
      expect(lines[0].querySelector('br')).not.toBeNull();
    });

    test('mirror scrollLeft syncs from textarea scroll', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 100px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      // A very long single line creates horizontal overflow in the mirror (white-space: pre)
      host.value = 'A'.repeat(500);
      await waitRAF();

      const textarea = getSlottedTextarea(host);
      Object.defineProperty(textarea, 'scrollLeft', { value: 30, configurable: true });
      textarea.dispatchEvent(new Event('scroll'));

      expect(getMirror(host).scrollLeft).toBe(30);
    });

    test('textarea slotted after initial render is correctly detected', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      // No textarea yet
      expect(host.value).toBe('');

      host.innerHTML = '<textarea>added later</textarea>';
      await host.updateComplete;
      await waitRAF();

      expect(host.value).toBe('added later');
      expect(getMirror(host).innerHTML).toContain('added later');
    });
  });

  // ─── Attribute and mode behavior ──────────────────────────────────────────

  describe('attribute and mode behavior', () => {
    test('read-only attribute sets textarea.readOnly on slot', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;" readOnly>
          <textarea>content</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      expect(getSlottedTextarea(host).readOnly).toBe(true);
    });

    test('setting readOnly dynamically propagates to textarea', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>content</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      expect(getSlottedTextarea(host).readOnly).toBe(false);

      host.readOnly = true;
      await host.updateComplete;
      expect(getSlottedTextarea(host).readOnly).toBe(true);
    });

    test('toggling lineNumbers on dynamically shows the gutter', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>one\ntwo</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      expect(getComputedStyle(getGutter(host)).display).toBe('none');

      host.lineNumbers = true;
      await host.updateComplete;

      expect(getComputedStyle(getGutter(host)).display).not.toBe('none');
    });

    test('auto-grow mode: host height grows as lines are added', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px;" autoGrow>
          <textarea>one line</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      const initialHeight = host.offsetHeight;

      host.value = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join('\n');
      await waitRAF();

      expect(host.offsetHeight).toBeGreaterThan(initialHeight);
    });
  });

  // ─── Form and validation integration ──────────────────────────────────────

  describe('form and validation', () => {
    test('name attribute on slotted textarea is preserved', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea name="message"></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      expect(getSlottedTextarea(host).name).toBe('message');
    });

    test('required attribute on slotted textarea triggers native validity', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea required></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const textarea = getSlottedTextarea(host);
      expect(textarea.required).toBe(true);
      expect(textarea.validity.valueMissing).toBe(true);
      expect(textarea.validity.valid).toBe(false);
    });

    test('maxlength attribute on slotted textarea remains accessible', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea maxlength="100"></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      expect(getSlottedTextarea(host).maxLength).toBe(100);
    });

    test('disabled attribute on slotted textarea is preserved', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea disabled></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      expect(getSlottedTextarea(host).disabled).toBe(true);
    });

    test('placeholder attribute is preserved and mirror content is empty', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea placeholder="Enter code here"></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      const textarea = getSlottedTextarea(host);
      expect(textarea.placeholder).toBe('Enter code here');

      // Mirror should be empty (placeholder is not part of value)
      const mirror = getMirror(host);
      expect(mirror.textContent?.trim()).toBe('');
    });

    test('rows attribute causes _adoptTextareaSize to set host height', async () => {
      // No inline style on host — _adoptTextareaSize must not bail out early
      const screen = render(html`
        <rc-textarea data-testid="host">
          <textarea rows="8"></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      // _adoptTextareaSize should have set a calculated height from rows=8
      expect(host.style.height).not.toBe('');
      expect(host.style.height).toContain('calc');
    });

    test('minlength attribute on slotted textarea is preserved by the component', async () => {
      // Verifies the component does not strip or override the minlength constraint.
      // (tooShort requires the dirty-value flag set by real user input, which is
      // not set by programmatic textarea.value assignment in all browsers.)
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea minlength="10"></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const textarea = getSlottedTextarea(host);
      expect(textarea.minLength).toBe(10);
    });
  });

  // ─── aria-invalid enhancements ─────────────────────────────────────────────

  describe('aria-invalid enhancements', () => {
    test('aria-invalid is set when the invalid event fires on the slotted textarea', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea required></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const textarea = getSlottedTextarea(host);
      textarea.dispatchEvent(new Event('invalid'));

      expect(textarea.getAttribute('aria-invalid')).toBe('true');
    });

    test('aria-invalid is set when an error-severity diagnostic is added', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>code</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      host.addDiagnostic({ line: 1, severity: 'error', message: 'Syntax error' });

      expect(getSlottedTextarea(host).getAttribute('aria-invalid')).toBe('true');
    });

    test('aria-invalid is not set for non-error diagnostics', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>code</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      host.addDiagnostic({ line: 1, severity: 'warning', message: 'Style issue' });
      host.addDiagnostic({ line: 2, severity: 'info', message: 'Info' });
      host.addDiagnostic({ line: 3, severity: 'hint', message: 'Hint' });

      expect(getSlottedTextarea(host).getAttribute('aria-invalid')).toBeNull();
    });

    test('aria-invalid is cleared when the last error diagnostic is removed', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>code</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const id = host.addDiagnostic({ line: 1, severity: 'error', message: 'Error' });
      expect(getSlottedTextarea(host).getAttribute('aria-invalid')).toBe('true');

      host.removeDiagnostic(id);
      expect(getSlottedTextarea(host).getAttribute('aria-invalid')).toBeNull();
    });

    test('aria-invalid is cleared when error diagnostics are cleared', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>code</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      host.addDiagnostic({ line: 1, severity: 'error', message: 'E1' });
      host.addDiagnostic({ line: 2, severity: 'error', message: 'E2' });
      expect(getSlottedTextarea(host).getAttribute('aria-invalid')).toBe('true');

      host.clearDiagnostics();
      expect(getSlottedTextarea(host).getAttribute('aria-invalid')).toBeNull();
    });

    test('aria-invalid is cleared on valid input after native invalid event', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea required></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const textarea = getSlottedTextarea(host);

      // Fire invalid event (empty required field)
      textarea.dispatchEvent(new Event('invalid'));
      expect(textarea.getAttribute('aria-invalid')).toBe('true');

      // Now type something valid
      textarea.value = 'some valid content';
      textarea.dispatchEvent(new InputEvent('input'));

      expect(textarea.getAttribute('aria-invalid')).toBeNull();
    });
  });

  // ─── aria-describedby linking ──────────────────────────────────────────────

  describe('aria-describedby linking', () => {
    test('sets aria-describedby containing diagnostic-status on slotted textarea', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const describedBy = getSlottedTextarea(host).getAttribute('aria-describedby') ?? '';
      expect(describedBy.split(' ')).toContain('diagnostic-status');
    });

    test('merges diagnostic-status with existing aria-describedby', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea aria-describedby="help-text"></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const ids = (getSlottedTextarea(host).getAttribute('aria-describedby') ?? '').split(' ');
      expect(ids).toContain('diagnostic-status');
      expect(ids).toContain('help-text');
    });

    test('removes diagnostic-status from old textarea when textarea is replaced', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const oldTextarea = getSlottedTextarea(host);
      expect(oldTextarea.getAttribute('aria-describedby')).toContain('diagnostic-status');

      // Replace with a new textarea
      host.innerHTML = '<textarea></textarea>';
      await host.updateComplete;
      await waitRAF();

      expect(oldTextarea.getAttribute('aria-describedby')).toBeNull();
      expect(getSlottedTextarea(host).getAttribute('aria-describedby')).toContain('diagnostic-status');
    });

    test('preserves consumer aria-describedby when diagnostic-status is removed', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea aria-describedby="help-text"></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      const oldTextarea = getSlottedTextarea(host);

      // Replacing the textarea triggers cleanup — should drop diagnostic-status but keep help-text
      host.innerHTML = '<textarea></textarea>';
      await host.updateComplete;
      await waitRAF();

      const ids = (oldTextarea.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
      expect(ids).not.toContain('diagnostic-status');
      expect(ids).toContain('help-text');
    });
  });

  describe('additional pattern edge cases', () => {
    test('pattern matches across multi-line content', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea></textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;

      host.value = 'start\nhello\nend';
      await waitRAF();

      // Pattern matching words on all lines independently
      host.addPattern({ pattern: /hello/g, className: 'hl' });
      await waitRAF();

      expect(getMirror(host).querySelector('.hl')?.textContent).toBe('hello');
    });

    test('pattern decorations are updated when value changes', async () => {
      const screen = render(html`
        <rc-textarea data-testid="host" style="width: 400px; height: 200px;">
          <textarea>no match</textarea>
        </rc-textarea>
      `);

      const host = screen.getByTestId('host').element() as RCTextarea;
      await host.updateComplete;
      await waitRAF();

      host.addPattern({ pattern: /\bfoo\b/g, className: 'foo-match' });
      await waitRAF();
      expect(getMirror(host).querySelector('.foo-match')).toBeNull();

      // Update value to include the pattern
      const textarea = getSlottedTextarea(host);
      textarea.value = 'now foo is here';
      textarea.dispatchEvent(new InputEvent('input'));
      await waitRAF();
      expect(getMirror(host).querySelector('.foo-match')).not.toBeNull();

      // Remove the match
      textarea.value = 'gone again';
      textarea.dispatchEvent(new InputEvent('input'));
      await waitRAF();
      expect(getMirror(host).querySelector('.foo-match')).toBeNull();
    });
  });

});
