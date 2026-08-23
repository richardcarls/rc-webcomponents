import { html, type TemplateResult } from 'lit';
import { describe, expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-lit';

import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';
import type { RCTextarea } from './rc-textarea.ts';
import type { RCTextareaPluginAPI } from './types.ts';
import {
  getEditor,
  getGutterCells,
  simulatePaste,
  getSlottedTextarea,
  waitRender,
} from './test-helpers.ts';
import './define';

async function renderTextarea(
  template: TemplateResult = html`
    <rc-textarea data-testid="host">
      <textarea name="notes" aria-label="Notes"></textarea>
    </rc-textarea>
  `,
): Promise<RCTextarea> {
  const screen = render(template);
  const host = screen.getByTestId('host').element() as RCTextarea;

  await host.updateComplete;

  return host;
}

function placeCaretAtEnd($editor: HTMLElement): void {
  const selection = window.getSelection()!;
  const $lastLine = $editor.querySelector<HTMLElement>('.line:last-child')!;

  // Selection.collapse() sets the caret directly; WebKit does not reliably
  // register a Range built with selectNodeContents()/addRange() on an editor
  // that was not already the focused element (rangeCount stays 0), which
  // silently falls back to the "no selection" insertion path.
  $editor.focus();
  selection.collapse($lastLine, $lastLine.childNodes.length);
}

describe('RCTextarea — basic rendering', () => {
  test('renders the accessible editor defaults', async () => {
    const host = await renderTextarea();
    const editor = getEditor(host);

    expect(editor).not.toBeNull();
    expect(editor.getAttribute('role')).toBe('textbox');
    expect(editor.getAttribute('aria-multiline')).toBe('true');
    expect(editor.contentEditable).toBe('true');
    expect(editor.spellcheck).toBe(false);
    expect(editor.getAttribute('autocorrect')).toBe('off');

    // Firefox normalizes autocapitalize="off" to "none".
    expect(['off', 'none']).toContain(editor.getAttribute('autocapitalize'));
  });

  test('has no automated accessibility violations', async () => {
    const host = await renderTextarea();

    await expectNoA11yViolations(host);
  });
});

describe('RCTextarea — value', () => {
  test('value defaults to empty string', async () => {
    const host = await renderTextarea();

    expect(host.value).toBe('');
  });

  test('default-value attribute seeds the initial value', async () => {
    const host = await renderTextarea(html`
      <rc-textarea data-testid="host" default-value="attribute seeded text">
        <textarea aria-label="Notes"></textarea>
      </rc-textarea>
    `);

    expect(host.value).toBe('attribute seeded text');
  });

  test('value renders single, multiline, and empty-line content', async () => {
    const host = await renderTextarea();

    host.value = 'hello world';

    await waitRender();

    const editor = getEditor(host);
    const lines = editor.querySelectorAll('.line');

    expect(lines).toHaveLength(1);
    expect(lines[0].textContent).toBe('hello world');

    host.value = 'line one\n\nline three';

    await waitRender();

    const multiline = getEditor(host).querySelectorAll('.line');

    expect(multiline).toHaveLength(3);
    expect(multiline[0].textContent).toBe('line one');
    expect(multiline[1].querySelector('br')).not.toBeNull();
    expect(multiline[2].textContent).toBe('line three');
  });

  test('Enter at the end of a line immediately renders a trailing empty line', async () => {
    const host = await renderTextarea();

    host.value = '2 cups paprika';

    await waitRender();

    const editor = getEditor(host);

    placeCaretAtEnd(editor);

    await userEvent.keyboard('{Enter}');

    await waitRender();

    const lines = editor.querySelectorAll('.line');

    expect(host.value).toBe('2 cups paprika\n');
    expect(lines).toHaveLength(2);
    expect(lines[1].querySelector('br')).not.toBeNull();
  });

  test('consecutive Enter presses immediately render consecutive empty lines', async () => {
    const host = await renderTextarea();

    host.value = 'Mix well.';

    await waitRender();

    const editor = getEditor(host);

    for (let i = 0; i < 2; i++) {
      placeCaretAtEnd(editor);

      await userEvent.keyboard('{Enter}');

      await waitRender();
    }

    expect(host.value).toBe('Mix well.\n\n');
    expect(editor.querySelectorAll('.line')).toHaveLength(3);
  });

  test('insertParagraph beforeinput creates a line without a keydown event', async () => {
    const host = await renderTextarea();

    host.value = 'Virtual keyboard';

    await waitRender();

    const editor = getEditor(host);
    const selection = window.getSelection()!;

    // See placeCaretAtEnd(): collapse() (not a manually addRange()'d Range)
    // is what reliably registers in WebKit for a focused contenteditable.
    editor.focus();
    selection.collapse(editor, editor.childNodes.length);

    const event = new InputEvent('beforeinput', {
      inputType: 'insertParagraph',
      bubbles: true,
      cancelable: true,
      composed: true,
    });

    editor.dispatchEvent(event);

    await waitRender();

    expect(event.defaultPrevented).toBe(true);
    expect(host.value).toBe('Virtual keyboard\n');
    expect(editor.querySelectorAll('.line')).toHaveLength(2);
  });
});

describe('RCTextarea — readOnly', () => {
  test('readOnly controls contentEditable in both directions', async () => {
    const host = await renderTextarea(html`
      <rc-textarea data-testid="host" read-only>
        <textarea aria-label="Notes"></textarea>
      </rc-textarea>
    `);

    expect(getEditor(host).contentEditable).toBe('false');

    host.readOnly = false;

    await host.updateComplete;

    expect(getEditor(host).contentEditable).toBe('true');

    host.readOnly = true;

    await host.updateComplete;

    expect(getEditor(host).contentEditable).toBe('false');
  });
});

describe('RCTextarea — accessible name', () => {
  test('copies aria-label from the native textarea', async () => {
    const host = await renderTextarea(html`
      <rc-textarea data-testid="host">
        <textarea aria-label="Code editor"></textarea>
      </rc-textarea>
    `);

    expect(getEditor(host).getAttribute('aria-label')).toBe('Code editor');
  });

  test('copies an associated native label while preserving the label relationship', async () => {
    const host = await renderTextarea(html`
      <label for="code-editor">Code editor</label>
      <rc-textarea data-testid="host">
        <textarea id="code-editor" name="source"></textarea>
      </rc-textarea>
    `);
    const $textarea = getSlottedTextarea(host);

    expect($textarea.labels?.[0]?.textContent).toBe('Code editor');
    expect(getEditor(host).getAttribute('aria-label')).toBe('Code editor');
  });
});

describe('RCTextarea — lineNumbers', () => {
  test('lineNumbers creates and updates one gutter cell per line', async () => {
    const host = await renderTextarea();

    host.value = 'a\nb\nc';

    await waitRender();

    expect(getGutterCells(host).children.length).toBe(0);

    host.lineNumbers = true;
    host.value = 'line1\nline2\nline3';

    await waitRender();

    const lineNumbers = getGutterCells(host);

    expect(lineNumbers.children.length).toBe(3);
    expect(lineNumbers.children[0].textContent).toBe('1');
    expect(lineNumbers.children[1].textContent).toBe('2');
    expect(lineNumbers.children[2].textContent).toBe('3');

    host.value = 'line1\nline2\nline3\nline4';

    await waitRender();

    expect(getGutterCells(host).children.length).toBe(4);
  });

  test('supports gutter typography independently from editor typography', async () => {
    const host = await renderTextarea(html`
      <rc-textarea
        data-testid="host"
        line-numbers
        style="--rc-textarea-font-family: serif; --rc-textarea-gutter-font-family: monospace"
      >
        <textarea aria-label="Notes"></textarea>
      </rc-textarea>
    `);

    host.value = 'line1\nline2';

    await waitRender();

    expect(getComputedStyle(getEditor(host)).fontFamily).toBe('serif');
    expect(getComputedStyle(getGutterCells(host)).fontFamily).toBe('monospace');
  });
});

describe('RCTextarea — slotted textarea', () => {
  test('slotted textarea is visually hidden', async () => {
    const host = await renderTextarea(html`
      <rc-textarea data-testid="host">
        <textarea></textarea>
      </rc-textarea>
    `);
    const textarea = getSlottedTextarea(host);

    expect(textarea.style.position).toBe('absolute');
    expect(textarea.getAttribute('aria-hidden')).toBe('true');
    expect(textarea.tabIndex).toBe(-1);
  });

  test('slotted textarea initial value seeds the editor', async () => {
    const host = await renderTextarea(html`
      <rc-textarea data-testid="host">
        <textarea>preset text</textarea>
      </rc-textarea>
    `);

    await waitRender();

    expect(host.value).toBe('preset text');
    expect(getEditor(host).querySelector('.line')?.textContent).toBe('preset text');
  });

  test('slotted textarea defaultValue property seeds the visible editor', async () => {
    const host = await renderTextarea(html`
      <rc-textarea data-testid="host">
        <textarea .defaultValue=${'property seeded text'}></textarea>
      </rc-textarea>
    `);

    await waitRender();

    expect(host.value).toBe('property seeded text');
    expect(getSlottedTextarea(host).value).toBe('property seeded text');
    expect(getEditor(host).querySelector('.line')?.textContent).toBe('property seeded text');
  });

  test('value setter syncs to the slotted textarea', async () => {
    const host = await renderTextarea(html`
      <rc-textarea data-testid="host">
        <textarea></textarea>
      </rc-textarea>
    `);

    host.value = 'synced value';

    await waitRender();

    expect(getSlottedTextarea(host).value).toBe('synced value');
  });
});

describe('RCTextarea — plugin API', () => {
  test('plugin.mount() is called with the plugin API', async () => {
    const host = await renderTextarea();

    let mountedApi: RCTextareaPluginAPI | null = null;

    host.usePlugin({
      mount(api) {
        mountedApi = api;
      },
    });

    expect(mountedApi).not.toBeNull();
    expect(typeof mountedApi!.addDecoration).toBe('function');
    expect(typeof mountedApi!.setDecorations).toBe('function');
    expect(mountedApi!.host).toBe(host);
  });

  test('plugin.update() receives value and api on each render', async () => {
    const host = await renderTextarea();
    const calls: string[] = [];

    host.usePlugin({
      update(value) {
        calls.push(value);
      },
    });

    host.value = 'hello';

    await waitRender();

    expect(calls).toContain('hello');
  });

  test('plugin mark and line decorations render their public attributes', async () => {
    const host = await renderTextarea();

    host.usePlugin({
      update(_value, api) {
        api.setDecorations([
          { type: 'mark', from: 0, to: 5, className: 'plugin-mark' },
          {
            type: 'line',
            line: 2,
            className: 'error-line',
            message: 'Unused variable',
          },
        ]);
      },
    });

    host.value = 'hello\nsecond';

    await waitRender();

    const mark = getEditor(host).querySelector('.plugin-mark');
    const lines = getEditor(host).querySelectorAll<HTMLElement>('.line');

    expect(mark).not.toBeNull();
    expect(mark!.textContent).toBe('hello');
    expect(lines[1].classList.contains('error-line')).toBe(true);
    expect(lines[0].classList.contains('error-line')).toBe(false);
    expect(lines[1].dataset.message).toContain('Unused variable');
  });

  test('removePlugin() destroys the plugin and cleans up decorations and stylesheets', async () => {
    const host = await renderTextarea();
    let destroyed = false;
    let sheet: CSSStyleSheet | null = null;

    host.usePlugin({
      mount(api) {
        sheet = api.adoptStyleSheet('.to-remove { color: blue; }');
      },
      update(_value, api) {
        api.setDecorations([{ type: 'mark', from: 0, to: 5, className: 'to-remove' }]);
      },
      destroy() {
        destroyed = true;
      },
    });

    host.value = 'hello world';

    await waitRender();

    expect(getEditor(host).querySelector('.to-remove')).not.toBeNull();
    expect(host.shadowRoot!.adoptedStyleSheets).toContain(sheet);

    host.removePlugin();
    host.value = 'hello world';

    await waitRender();

    expect(getEditor(host).querySelector('.to-remove')).toBeNull();
    expect(destroyed).toBe(true);
    expect(host.shadowRoot!.adoptedStyleSheets).not.toContain(sheet);
  });

  test('replacing a plugin calls destroy() on the old one', async () => {
    const host = await renderTextarea();

    let oldDestroyed = false;

    host.usePlugin({
      destroy() {
        oldDestroyed = true;
      },
    });

    host.usePlugin({});

    expect(oldDestroyed).toBe(true);
  });

  test('a declarative plugin assigned before connection mounts with its stylesheet', async () => {
    const host = document.createElement('rc-textarea') as RCTextarea;
    const $textarea = document.createElement('textarea');
    let mountCount = 0;
    let sheet: CSSStyleSheet | null = null;

    $textarea.setAttribute('aria-label', 'Notes');
    host.append($textarea);

    host.plugin = {
      mount(api) {
        mountCount++;
        sheet = api.adoptStyleSheet('.preconnected-plugin { display: block; }');
      },
    };

    expect(mountCount).toBe(0);

    document.body.append(host);
    await host.updateComplete;

    expect(mountCount).toBe(1);
    expect(host.shadowRoot!.adoptedStyleSheets).toContain(sheet);

    host.remove();
  });

  test('reconnect remounts a declarative plugin and restores its stylesheet', async () => {
    const host = await renderTextarea();
    let mountCount = 0;
    const sheets: CSSStyleSheet[] = [];

    host.plugin = {
      mount(api) {
        mountCount++;
        sheets.push(api.adoptStyleSheet('.reconnected-plugin { display: block; }'));
      },
    };

    const parent = host.parentElement!;

    host.remove();
    parent.append(host);
    await host.updateComplete;

    expect(mountCount).toBe(2);
    expect(host.shadowRoot!.adoptedStyleSheets).toContain(sheets[1]);
    expect(host.shadowRoot!.adoptedStyleSheets).not.toContain(sheets[0]);
  });

  test('api.parseDecorationsFromHtml() parses highlight.js-style spans', async () => {
    const host = await renderTextarea();

    let parsedDecorations: ReturnType<RCTextareaPluginAPI['parseDecorationsFromHtml']> = [];

    host.usePlugin({
      mount(api) {
        parsedDecorations = api.parseDecorationsFromHtml(
          '<span class="hljs-keyword">function</span> foo',
        );
      },
    });

    expect(parsedDecorations).toHaveLength(1);
    expect(parsedDecorations[0].className).toBe('hljs-keyword');
    expect(parsedDecorations[0].from).toBe(0);
    expect(parsedDecorations[0].to).toBe('function'.length);
  });

  test('highlight() return value is parsed and applied as decorations', async () => {
    const host = await renderTextarea();

    host.usePlugin({
      highlight(_value) {
        return '<span class="kw">hello</span> world';
      },
    });

    host.value = 'hello world';

    await waitRender();

    const mark = getEditor(host).querySelector('.kw');

    expect(mark).not.toBeNull();
    expect(mark!.textContent).toBe('hello');
  });
});

describe('RCTextarea — pattern API', () => {
  test('addPattern() returns an id and renders mark formatting and line decorations', async () => {
    const host = await renderTextarea();

    const id = host.addPattern({
      pattern: /ERROR/g,
      className: 'error-mark',
      bold: true,
      color: '#ff0000',
      createLineDecoration: () => ({ className: 'error-line' }),
    });

    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);

    host.value = 'ok\nERROR here\nok';

    await waitRender();

    const mark = getEditor(host).querySelector('.error-mark') as HTMLElement | null;
    const lines = getEditor(host).querySelectorAll('.line');

    expect(mark).not.toBeNull();
    expect(mark!.textContent).toBe('ERROR');
    expect(mark!.style.fontWeight).toBe('bold');
    expect(mark!.style.color).toBe('rgb(255, 0, 0)');
    expect(lines[1].classList.contains('error-line')).toBe(true);
    expect(lines[0].classList.contains('error-line')).toBe(false);
  });

  test('removePattern() removes its decorations from subsequent renders', async () => {
    const host = await renderTextarea();

    const id = host.addPattern({ pattern: /hello/g, className: 'bye-mark' });

    host.value = 'hello world';

    await waitRender();

    expect(getEditor(host).querySelector('.bye-mark')).not.toBeNull();

    host.removePattern(id);
    host.value = 'hello world';

    await waitRender();

    expect(getEditor(host).querySelector('.bye-mark')).toBeNull();
  });

  test('clearPatterns() removes all pattern decorations', async () => {
    const host = await renderTextarea();

    host.addPattern({ pattern: /foo/g, className: 'foo-mark' });
    host.addPattern({ pattern: /bar/g, className: 'bar-mark' });
    host.value = 'foo and bar';

    await waitRender();

    expect(getEditor(host).querySelector('.foo-mark')).not.toBeNull();
    expect(getEditor(host).querySelector('.bar-mark')).not.toBeNull();

    host.clearPatterns();
    host.value = 'foo and bar';

    await waitRender();

    expect(getEditor(host).querySelector('.foo-mark')).toBeNull();
    expect(getEditor(host).querySelector('.bar-mark')).toBeNull();
  });
});

describe('RCTextarea — events', () => {
  test('rc-textarea-change does not fire on value setter', async () => {
    const host = await renderTextarea();

    const events: CustomEvent[] = [];

    host.addEventListener('rc-textarea-change', (e) => events.push(e as CustomEvent));
    host.value = 'new content';

    expect(events).toHaveLength(0);
    expect(host.value).toBe('new content');
  });

  test('rc-textarea-change bubbles and is composed for user edits', async () => {
    const host = await renderTextarea();

    const events: CustomEvent[] = [];
    const listener = (event: Event) => events.push(event as CustomEvent);

    document.addEventListener('rc-textarea-change', listener);

    const editor = getEditor(host);

    editor.textContent = 'bubbling';
    editor.dispatchEvent(new InputEvent('input', { bubbles: true }));

    document.removeEventListener('rc-textarea-change', listener);

    expect(events.length).toBeGreaterThanOrEqual(1);
  });
});

describe('RCTextarea — decoration edge cases', () => {
  test('mark spanning a newline decorates text on both sides', async () => {
    const host = await renderTextarea();

    host.addPattern({ pattern: /ne\ntw/g, className: 'cross-line' });
    host.value = 'one\ntwo';

    await waitRender();

    expect(getEditor(host).querySelector('.cross-line')).not.toBeNull();
  });

  test('mark decoration with custom attributes renders them on the span', async () => {
    const host = await renderTextarea();

    host.usePlugin({
      update(_value, api) {
        api.setDecorations([
          {
            type: 'mark',
            from: 0,
            to: 5,
            className: 'attr-mark',
            attributes: { 'data-kind': 'keyword', title: 'built-in' },
          },
        ]);
      },
    });

    host.value = 'hello world';

    await waitRender();

    const mark = getEditor(host).querySelector('.attr-mark');

    expect(mark).not.toBeNull();
    expect(mark!.getAttribute('data-kind')).toBe('keyword');
    expect(mark!.getAttribute('title')).toBe('built-in');
  });

  test('out-of-range decorations are ignored', async () => {
    const host = await renderTextarea();

    host.usePlugin({
      update(_value, api) {
        api.setDecorations([
          { type: 'mark', from: 100, to: 200, className: 'oob' },
          { type: 'line', line: 99, className: 'ghost' },
        ]);
      },
    });

    host.value = 'short';

    await waitRender();

    expect(getEditor(host).querySelector('.oob')).toBeNull();
    expect(getEditor(host).querySelector('.ghost')).toBeNull();
  });
});

describe('RCTextarea — paste', () => {
  test('pasting into an empty editor preserves text and normalizes line endings', async () => {
    const host = await renderTextarea();
    const cases = [
      { pasted: 'hello world', expected: 'hello world', lines: 1 },
      {
        pasted: 'line one\nline two\nline three',
        expected: 'line one\nline two\nline three',
        lines: 3,
      },
      { pasted: 'first\r\nsecond\r\nthird', expected: 'first\nsecond\nthird', lines: 3 },
      { pasted: 'a\rb\rc', expected: 'a\nb\nc', lines: 3 },
    ];

    for (const { pasted, expected, lines } of cases) {
      host.value = '';
      await waitRender();
      window.getSelection()?.removeAllRanges();

      simulatePaste(getEditor(host), pasted);
      await waitRender();

      expect(host.value).toBe(expected);
      expect(getEditor(host).querySelectorAll('.line')).toHaveLength(lines);
    }
  });

  test('pasting multi-line text fires rc-textarea-change with the full value', async () => {
    const host = await renderTextarea();
    const events: CustomEvent[] = [];

    host.addEventListener('rc-textarea-change', (e) => events.push(e as CustomEvent));

    simulatePaste(getEditor(host), 'foo\nbar');

    await waitRender();

    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[events.length - 1].detail.value).toBe('foo\nbar');
  });

  test('pasting multi-line text syncs to the slotted textarea', async () => {
    const host = await renderTextarea(html`
      <rc-textarea data-testid="host">
        <textarea></textarea>
      </rc-textarea>
    `);

    simulatePaste(getEditor(host), 'alpha\nbeta');

    await waitRender();

    expect(getSlottedTextarea(host).value).toBe('alpha\nbeta');
  });

  test('pasting into editor with existing content inserts at the start (no selection)', async () => {
    const host = await renderTextarea();

    host.value = 'existing';

    await waitRender();

    simulatePaste(getEditor(host), 'new\nlines\n');

    await waitRender();

    expect(host.value).toBe('new\nlines\nexisting');
  });
});
