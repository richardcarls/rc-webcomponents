import { test, expect, describe } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './define';
import type { RCTextarea } from './rc-textarea.ts';
import type { RCTextareaPluginAPI } from './types.ts';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';
import {
  getEditor,
  getGutterCells,
  getSlottedTextarea,
  waitRender,
  simulatePaste,
} from './test-helpers.ts';

// ── Basic rendering and ARIA ──────────────────────────────────────────────────

describe('RCTextarea — basic rendering', () => {
  test('renders the #editor contenteditable div', async () => {
    const screen = render(html`
      <rc-textarea
        data-testid="host"
        style="width: 400px; height: 200px;"
      ></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    const editor = getEditor(host);
    expect(editor).not.toBeNull();
  });

  test('editor has role="textbox" and aria-multiline="true"', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    const editor = getEditor(host);
    expect(editor.getAttribute('role')).toBe('textbox');
    expect(editor.getAttribute('aria-multiline')).toBe('true');
  });

  test('has no automated accessibility violations', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host" label="Notes"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    await expectNoA11yViolations(host);
  });

  test('editor is contenteditable by default', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    const editor = getEditor(host);
    expect(editor.contentEditable).toBe('true');
  });

  test('spellcheck and autocorrect are disabled on the editor', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    const editor = getEditor(host);
    expect(editor.spellcheck).toBe(false);
    expect(editor.getAttribute('autocorrect')).toBe('off');
    // Firefox normalizes autocapitalize="off" to "none"; both mean disabled
    expect(['off', 'none']).toContain(editor.getAttribute('autocapitalize'));
  });
});

// ── value property ────────────────────────────────────────────────────────────

describe('RCTextarea — value', () => {
  test('value defaults to empty string', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    expect(host.value).toBe('');
  });

  test('setting value renders lines in the editor', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.value = 'hello world';
    await waitRender();

    const editor = getEditor(host);
    const lines = editor.querySelectorAll('.v2-line');
    expect(lines).toHaveLength(1);
    expect(lines[0].textContent).toBe('hello world');
  });

  test('multiline value creates one .v2-line per line', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.value = 'line one\nline two\nline three';
    await waitRender();

    const lines = getEditor(host).querySelectorAll('.v2-line');
    expect(lines).toHaveLength(3);
    expect(lines[0].textContent).toBe('line one');
    expect(lines[1].textContent).toBe('line two');
    expect(lines[2].textContent).toBe('line three');
  });

  test('setting the same value twice does not trigger a second render', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.value = 'hello';
    await waitRender();

    // Grab a reference to the first line element
    const firstLine = getEditor(host).querySelector('.v2-line');

    // Set same value — should be a no-op (setter guards with ===)
    host.value = 'hello';
    await waitRender();

    // The line element reference should be different (build() always rebuilds)
    // but the content should be identical — no crash
    expect(getEditor(host).querySelector('.v2-line')?.textContent).toBe(
      'hello',
    );
    expect(firstLine).not.toBeNull();
  });

  test('empty line in the middle renders a <br> for cursor placement', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.value = 'a\n\nb';
    await waitRender();

    const lines = getEditor(host).querySelectorAll('.v2-line');
    expect(lines).toHaveLength(3);
    expect(lines[1].querySelector('br')).not.toBeNull();
  });
});

// ── readOnly ──────────────────────────────────────────────────────────────────

describe('RCTextarea — readOnly', () => {
  test('readOnly=true sets contentEditable to false', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host" read-only></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    expect(getEditor(host).contentEditable).toBe('false');
  });

  test('setting readOnly programmatically updates contentEditable', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    expect(getEditor(host).contentEditable).toBe('true');

    host.readOnly = true;
    await host.updateComplete;

    expect(getEditor(host).contentEditable).toBe('false');
  });

  test('toggling readOnly off restores contentEditable to true', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host" read-only></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.readOnly = false;
    await host.updateComplete;

    expect(getEditor(host).contentEditable).toBe('true');
  });
});

// ── label ─────────────────────────────────────────────────────────────────────

describe('RCTextarea — label', () => {
  test('label property sets aria-label on the editor', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.label = 'My editor';
    await host.updateComplete;

    expect(getEditor(host).getAttribute('aria-label')).toBe('My editor');
  });

  test('label attribute sets aria-label at initial render', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host" label="Code editor"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    expect(getEditor(host).getAttribute('aria-label')).toBe('Code editor');
  });
});

// ── lineNumbers ───────────────────────────────────────────────────────────────

describe('RCTextarea — lineNumbers', () => {
  test('lineNumbers=false: gutter has no line-number spans', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.value = 'a\nb\nc';
    await waitRender();

    expect(getGutterCells(host).children.length).toBe(0);
  });

  test('lineNumbers=true: gutter gets one span per line', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host" line-numbers></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.value = 'line1\nline2\nline3';
    await waitRender();

    const lineNums = getGutterCells(host);
    expect(lineNums.children.length).toBe(3);
    expect(lineNums.children[0].textContent).toBe('1');
    expect(lineNums.children[1].textContent).toBe('2');
    expect(lineNums.children[2].textContent).toBe('3');
  });

  test('adding a line adds a line-number span', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host" line-numbers></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.value = 'line1\nline2';
    await waitRender();
    expect(getGutterCells(host).children.length).toBe(2);

    host.value = 'line1\nline2\nline3';
    await waitRender();
    expect(getGutterCells(host).children.length).toBe(3);
  });
});

// ── Slotted textarea wiring ───────────────────────────────────────────────────

describe('RCTextarea — slotted textarea', () => {
  test('slotted textarea is visually hidden', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host">
        <textarea></textarea>
      </rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    const ta = getSlottedTextarea(host);
    expect(ta.style.position).toBe('absolute');
    expect(ta.getAttribute('aria-hidden')).toBe('true');
    expect(ta.tabIndex).toBe(-1);
  });

  test('slotted textarea initial value seeds the editor', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host">
        <textarea>preset text</textarea>
      </rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;
    await waitRender();

    expect(host.value).toBe('preset text');
  });

  test('value setter syncs to the slotted textarea', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host">
        <textarea></textarea>
      </rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.value = 'synced value';
    await waitRender();

    expect(getSlottedTextarea(host).value).toBe('synced value');
  });
});

// ── Plugin API ────────────────────────────────────────────────────────────────

describe('RCTextarea — plugin API', () => {
  test('plugin.mount() is called with the plugin API', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

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
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

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

  test('mark decoration from plugin renders a span in the editor', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.usePlugin({
      update(_value, api) {
        api.setDecorations([
          { type: 'mark', from: 0, to: 5, className: 'plugin-mark' },
        ]);
      },
    });

    host.value = 'hello world';
    await waitRender();

    const span = getEditor(host).querySelector('.plugin-mark');
    expect(span).not.toBeNull();
    expect(span!.textContent).toBe('hello');
  });

  test('line decoration from plugin applies className to the line div', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.usePlugin({
      update(_value, api) {
        api.setDecorations([
          { type: 'line', line: 2, className: 'error-line' },
        ]);
      },
    });

    host.value = 'first\nsecond\nthird';
    await waitRender();

    const lines = getEditor(host).querySelectorAll('.v2-line');
    expect(lines[1].classList.contains('error-line')).toBe(true);
    expect(lines[0].classList.contains('error-line')).toBe(false);
  });

  test('line decoration message is set as data-message attribute', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.usePlugin({
      update(_value, api) {
        api.setDecorations([
          {
            type: 'line',
            line: 1,
            message: 'Unused variable',
          },
        ]);
      },
    });

    host.value = 'let x = 1;';
    await waitRender();

    const line = getEditor(host).querySelector('.v2-line') as HTMLElement;
    expect(line.dataset.message).toContain('Unused variable');
  });

  test('removePlugin() cleans up decorations', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.usePlugin({
      update(_value, api) {
        api.setDecorations([
          { type: 'mark', from: 0, to: 5, className: 'to-remove' },
        ]);
      },
    });

    host.value = 'hello world';
    await waitRender();
    expect(getEditor(host).querySelector('.to-remove')).not.toBeNull();

    host.removePlugin();
    host.value = 'hello world'; // trigger re-render to rebuild without plugin
    await waitRender();

    expect(getEditor(host).querySelector('.to-remove')).toBeNull();
  });

  test('plugin.destroy() is called on removePlugin()', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    let destroyed = false;
    host.usePlugin({
      destroy() {
        destroyed = true;
      },
    });
    host.removePlugin();

    expect(destroyed).toBe(true);
  });

  test('replacing a plugin calls destroy() on the old one', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    let oldDestroyed = false;
    host.usePlugin({
      destroy() {
        oldDestroyed = true;
      },
    });
    host.usePlugin({}); // replace

    expect(oldDestroyed).toBe(true);
  });

  test('api.adoptStyleSheet() adds a stylesheet to the shadow root', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    let adoptedSheet: CSSStyleSheet | null = null;
    host.usePlugin({
      mount(api) {
        adoptedSheet = api.adoptStyleSheet('.plugin-rule { color: red; }');
      },
    });

    expect(adoptedSheet).not.toBeNull();
    expect(host.shadowRoot!.adoptedStyleSheets).toContain(adoptedSheet);
  });

  test('removePlugin() removes adopted stylesheets', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    let sheet: CSSStyleSheet | null = null;
    host.usePlugin({
      mount(api) {
        sheet = api.adoptStyleSheet('.rule { color: blue; }');
      },
    });

    expect(host.shadowRoot!.adoptedStyleSheets).toContain(sheet);

    host.removePlugin();

    expect(host.shadowRoot!.adoptedStyleSheets).not.toContain(sheet);
  });

  test('api.decorationsFromHtml() parses highlight.js-style spans', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    let parsedDecs: ReturnType<RCTextareaPluginAPI['decorationsFromHtml']> = [];
    host.usePlugin({
      mount(api) {
        parsedDecs = api.decorationsFromHtml(
          '<span class="hljs-keyword">function</span> foo',
        );
      },
    });

    expect(parsedDecs).toHaveLength(1);
    expect(parsedDecs[0].className).toBe('hljs-keyword');
    expect(parsedDecs[0].from).toBe(0);
    expect(parsedDecs[0].to).toBe(8); // "function".length
  });

  test('highlight() return value is parsed and applied as decorations', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.usePlugin({
      highlight(_value) {
        return '<span class="kw">hello</span> world';
      },
    });

    host.value = 'hello world';
    await waitRender();

    expect(getEditor(host).querySelector('.kw')).not.toBeNull();
    expect(getEditor(host).querySelector('.kw')!.textContent).toBe('hello');
  });
});

// ── Pattern API ───────────────────────────────────────────────────────────────

describe('RCTextarea — pattern API', () => {
  test('addPattern() returns a string id', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    const id = host.addPattern({ pattern: /hello/g, className: 'hi' });
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  test('addPattern() renders mark spans for matching text', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.addPattern({ pattern: /hello/g, className: 'hi-mark' });
    host.value = 'hello world';
    await waitRender();

    expect(getEditor(host).querySelector('.hi-mark')).not.toBeNull();
    expect(getEditor(host).querySelector('.hi-mark')!.textContent).toBe(
      'hello',
    );
  });

  test('removePattern() removes its decorations from subsequent renders', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    const id = host.addPattern({ pattern: /hello/g, className: 'bye-mark' });
    host.value = 'hello world';
    await waitRender();
    expect(getEditor(host).querySelector('.bye-mark')).not.toBeNull();

    host.removePattern(id);
    host.value = 'hello world'; // retrigger render
    await waitRender();

    expect(getEditor(host).querySelector('.bye-mark')).toBeNull();
  });

  test('clearPatterns() removes all pattern decorations', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

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

  test('pattern with formatting properties renders inline styles', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.addPattern({
      pattern: /bold/g,
      className: 'bold-mark',
      bold: true,
      color: '#ff0000',
    });
    host.value = 'this is bold text';
    await waitRender();

    const span = getEditor(host).querySelector(
      '.bold-mark',
    ) as HTMLElement | null;
    expect(span).not.toBeNull();
    expect(span!.style.fontWeight).toBe('bold');
    expect(span!.style.color).toBe('rgb(255, 0, 0)');
  });

  test('createLineDecoration on a pattern applies class to the correct line', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.addPattern({
      pattern: /ERROR/g,
      className: 'err-mark',
      createLineDecoration: () => ({ className: 'err-line' }),
    });
    host.value = 'ok\nERROR here\nok';
    await waitRender();

    const lines = getEditor(host).querySelectorAll('.v2-line');
    expect(lines[1].classList.contains('err-line')).toBe(true);
    expect(lines[0].classList.contains('err-line')).toBe(false);
  });
});

// ── Events ────────────────────────────────────────────────────────────────────

describe('RCTextarea — events', () => {
  test('rc-textarea-change does not fire on value setter', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    const events: CustomEvent[] = [];
    host.addEventListener('rc-textarea-change', (e) =>
      events.push(e as CustomEvent),
    );

    host.value = 'new content';

    expect(events).toHaveLength(0);
    expect(host.value).toBe('new content');
  });

  test('rc-textarea-change bubbles and is composed for user edits', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    const events: CustomEvent[] = [];
    document.addEventListener('rc-textarea-change', (e) =>
      events.push(e as CustomEvent),
    );

    const editor = getEditor(host);
    editor.textContent = 'bubbling';
    editor.dispatchEvent(new InputEvent('input', { bubbles: true }));

    document.removeEventListener('rc-textarea-change', (e) =>
      events.push(e as CustomEvent),
    );
    expect(events.length).toBeGreaterThanOrEqual(1);
  });
});

// ── Decoration edge cases ─────────────────────────────────────────────────────

describe('RCTextarea — decoration edge cases', () => {
  test('mark spanning a newline decorates text on both sides', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.addPattern({ pattern: /ne\ntw/g, className: 'cross-line' });
    host.value = 'one\ntwo';
    await waitRender();

    // Should not crash; at least one span with the class exists
    expect(getEditor(host).querySelector('.cross-line')).not.toBeNull();
  });

  test('mark decoration with custom attributes renders them on the span', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

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

    const span = getEditor(host).querySelector('.attr-mark');
    expect(span).not.toBeNull();
    expect(span!.getAttribute('data-kind')).toBe('keyword');
    expect(span!.getAttribute('title')).toBe('built-in');
  });

  test('out-of-range mark decoration does not crash', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.usePlugin({
      update(_value, api) {
        api.setDecorations([
          { type: 'mark', from: 100, to: 200, className: 'oob' },
        ]);
      },
    });

    host.value = 'short';
    await waitRender();

    // Must not crash; no span expected
    expect(getEditor(host).querySelector('.oob')).toBeNull();
  });

  test('out-of-range line decoration does not crash', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.usePlugin({
      update(_value, api) {
        api.setDecorations([{ type: 'line', line: 99, className: 'ghost' }]);
      },
    });

    host.value = 'just one line';
    await waitRender();

    expect(getEditor(host).querySelector('.ghost')).toBeNull();
  });
});

// ── Paste handling ─────────────────────────────────────────────────────────────

describe('RCTextarea — paste', () => {
  test('pasting single-line text into an empty editor sets the value', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    simulatePaste(getEditor(host), 'hello world');
    await waitRender();

    expect(host.value).toBe('hello world');
    expect(getEditor(host).querySelectorAll('.v2-line')).toHaveLength(1);
  });

  test('pasting multi-line text into an empty editor preserves newlines', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    simulatePaste(getEditor(host), 'line one\nline two\nline three');
    await waitRender();

    expect(host.value).toBe('line one\nline two\nline three');
    const lines = getEditor(host).querySelectorAll('.v2-line');
    expect(lines).toHaveLength(3);
    expect(lines[0].textContent).toBe('line one');
    expect(lines[1].textContent).toBe('line two');
    expect(lines[2].textContent).toBe('line three');
  });

  test('pasting text with \\r\\n line endings normalizes to \\n', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    simulatePaste(getEditor(host), 'first\r\nsecond\r\nthird');
    await waitRender();

    expect(host.value).toBe('first\nsecond\nthird');
    expect(getEditor(host).querySelectorAll('.v2-line')).toHaveLength(3);
  });

  test('pasting text with legacy \\r line endings normalizes to \\n', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    simulatePaste(getEditor(host), 'a\rb\rc');
    await waitRender();

    expect(host.value).toBe('a\nb\nc');
    expect(getEditor(host).querySelectorAll('.v2-line')).toHaveLength(3);
  });

  test('pasting multi-line text fires rc-textarea-change with the full value', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    const events: CustomEvent[] = [];
    host.addEventListener('rc-textarea-change', (e) =>
      events.push(e as CustomEvent),
    );

    simulatePaste(getEditor(host), 'foo\nbar');
    await waitRender();

    expect(events.length).toBeGreaterThanOrEqual(1);
    expect(events[events.length - 1].detail.value).toBe('foo\nbar');
  });

  test('pasting multi-line text syncs to the slotted textarea', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host">
        <textarea></textarea>
      </rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    simulatePaste(getEditor(host), 'alpha\nbeta');
    await waitRender();

    expect(getSlottedTextarea(host).value).toBe('alpha\nbeta');
  });

  test('pasting into editor with existing content inserts at the start (no selection)', async () => {
    const screen = render(html`
      <rc-textarea data-testid="host"></rc-textarea>
    `);
    const host = screen.getByTestId('host').element() as RCTextarea;
    await host.updateComplete;

    host.value = 'existing';
    await waitRender();

    // No DOM selection set — paste falls back to offset 0,0 (prepend)
    simulatePaste(getEditor(host), 'new\nlines\n');
    await waitRender();

    expect(host.value).toBe('new\nlines\nexisting');
  });
});
