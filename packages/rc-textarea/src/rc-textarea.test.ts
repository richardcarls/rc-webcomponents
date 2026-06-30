import { html, type TemplateResult } from 'lit';
import { describe, expect, test } from 'vitest';
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
  template: TemplateResult = html`<rc-textarea data-testid="host"></rc-textarea>`,
): Promise<RCTextarea> {
  const screen = render(template);
  const host = screen.getByTestId('host').element() as RCTextarea;

  await host.updateComplete;

  return host;
}

describe('RCTextarea — basic rendering', () => {
  test('renders the #editor contenteditable div', async () => {
    const host = await renderTextarea(html`
      <rc-textarea data-testid="host" style="width: 400px; height: 200px;"></rc-textarea>
    `);
    const editor = getEditor(host);

    expect(editor).not.toBeNull();
  });

  test('editor has role="textbox" and aria-multiline="true"', async () => {
    const host = await renderTextarea();
    const editor = getEditor(host);

    expect(editor.getAttribute('role')).toBe('textbox');
    expect(editor.getAttribute('aria-multiline')).toBe('true');
  });

  test('has no automated accessibility violations', async () => {
    const host = await renderTextarea(html`
      <rc-textarea data-testid="host" label="Notes"></rc-textarea>
    `);

    await expectNoA11yViolations(host);
  });

  test('editor is contenteditable by default', async () => {
    const host = await renderTextarea();
    const editor = getEditor(host);

    expect(editor.contentEditable).toBe('true');
  });

  test('spellcheck and autocorrect are disabled on the editor', async () => {
    const host = await renderTextarea();
    const editor = getEditor(host);

    expect(editor.spellcheck).toBe(false);
    expect(editor.getAttribute('autocorrect')).toBe('off');

    // Firefox normalizes autocapitalize="off" to "none".
    expect(['off', 'none']).toContain(editor.getAttribute('autocapitalize'));
  });
});

describe('RCTextarea — value', () => {
  test('value defaults to empty string', async () => {
    const host = await renderTextarea();

    expect(host.value).toBe('');
  });

  test('setting value renders lines in the editor', async () => {
    const host = await renderTextarea();

    host.value = 'hello world';

    await waitRender();

    const editor = getEditor(host);
    const lines = editor.querySelectorAll('.line');

    expect(lines).toHaveLength(1);
    expect(lines[0].textContent).toBe('hello world');
  });

  test('multiline value creates one .line per line', async () => {
    const host = await renderTextarea();

    host.value = 'line one\nline two\nline three';

    await waitRender();

    const lines = getEditor(host).querySelectorAll('.line');

    expect(lines).toHaveLength(3);
    expect(lines[0].textContent).toBe('line one');
    expect(lines[1].textContent).toBe('line two');
    expect(lines[2].textContent).toBe('line three');
  });

  test('setting the same value twice leaves rendered content intact', async () => {
    const host = await renderTextarea();

    host.value = 'hello';

    await waitRender();

    const firstLine = getEditor(host).querySelector('.line');

    host.value = 'hello';

    await waitRender();

    expect(getEditor(host).querySelector('.line')?.textContent).toBe('hello');
    expect(firstLine).not.toBeNull();
  });

  test('empty line in the middle renders a <br> for cursor placement', async () => {
    const host = await renderTextarea();

    host.value = 'a\n\nb';

    await waitRender();

    const lines = getEditor(host).querySelectorAll('.line');

    expect(lines).toHaveLength(3);
    expect(lines[1].querySelector('br')).not.toBeNull();
  });
});

describe('RCTextarea — readOnly', () => {
  test('readOnly=true sets contentEditable to false', async () => {
    const host = await renderTextarea(html`
      <rc-textarea data-testid="host" read-only></rc-textarea>
    `);

    expect(getEditor(host).contentEditable).toBe('false');
  });

  test('setting readOnly programmatically updates contentEditable', async () => {
    const host = await renderTextarea();

    expect(getEditor(host).contentEditable).toBe('true');

    host.readOnly = true;

    await host.updateComplete;

    expect(getEditor(host).contentEditable).toBe('false');
  });

  test('toggling readOnly off restores contentEditable to true', async () => {
    const host = await renderTextarea(html`
      <rc-textarea data-testid="host" read-only></rc-textarea>
    `);

    host.readOnly = false;

    await host.updateComplete;

    expect(getEditor(host).contentEditable).toBe('true');
  });
});

describe('RCTextarea — label', () => {
  test('label property sets aria-label on the editor', async () => {
    const host = await renderTextarea();

    host.label = 'My editor';

    await host.updateComplete;

    expect(getEditor(host).getAttribute('aria-label')).toBe('My editor');
  });

  test('label attribute sets aria-label at initial render', async () => {
    const host = await renderTextarea(html`
      <rc-textarea data-testid="host" label="Code editor"></rc-textarea>
    `);

    expect(getEditor(host).getAttribute('aria-label')).toBe('Code editor');
  });
});

describe('RCTextarea — lineNumbers', () => {
  test('lineNumbers=false: gutter has no line-number spans', async () => {
    const host = await renderTextarea();

    host.value = 'a\nb\nc';

    await waitRender();

    expect(getGutterCells(host).children.length).toBe(0);
  });

  test('lineNumbers=true: gutter gets one span per line', async () => {
    const host = await renderTextarea(html`
      <rc-textarea data-testid="host" line-numbers></rc-textarea>
    `);

    host.value = 'line1\nline2\nline3';

    await waitRender();

    const lineNumbers = getGutterCells(host);

    expect(lineNumbers.children.length).toBe(3);
    expect(lineNumbers.children[0].textContent).toBe('1');
    expect(lineNumbers.children[1].textContent).toBe('2');
    expect(lineNumbers.children[2].textContent).toBe('3');
  });

  test('adding a line adds a line-number span', async () => {
    const host = await renderTextarea(html`
      <rc-textarea data-testid="host" line-numbers></rc-textarea>
    `);

    host.value = 'line1\nline2';

    await waitRender();

    expect(getGutterCells(host).children.length).toBe(2);

    host.value = 'line1\nline2\nline3';

    await waitRender();

    expect(getGutterCells(host).children.length).toBe(3);
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

  test('mark decoration from plugin renders a span in the editor', async () => {
    const host = await renderTextarea();

    host.usePlugin({
      update(_value, api) {
        api.setDecorations([{ type: 'mark', from: 0, to: 5, className: 'plugin-mark' }]);
      },
    });

    host.value = 'hello world';

    await waitRender();

    const mark = getEditor(host).querySelector('.plugin-mark');

    expect(mark).not.toBeNull();
    expect(mark!.textContent).toBe('hello');
  });

  test('line decoration from plugin applies className to the line div', async () => {
    const host = await renderTextarea();

    host.usePlugin({
      update(_value, api) {
        api.setDecorations([{ type: 'line', line: 2, className: 'error-line' }]);
      },
    });

    host.value = 'first\nsecond\nthird';

    await waitRender();

    const lines = getEditor(host).querySelectorAll('.line');

    expect(lines[1].classList.contains('error-line')).toBe(true);
    expect(lines[0].classList.contains('error-line')).toBe(false);
  });

  test('line decoration message is set as data-message attribute', async () => {
    const host = await renderTextarea();

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

    const lineElement = getEditor(host).querySelector('.line') as HTMLElement;

    expect(lineElement.dataset.message).toContain('Unused variable');
  });

  test('removePlugin() cleans up decorations', async () => {
    const host = await renderTextarea();

    host.usePlugin({
      update(_value, api) {
        api.setDecorations([{ type: 'mark', from: 0, to: 5, className: 'to-remove' }]);
      },
    });

    host.value = 'hello world';

    await waitRender();

    expect(getEditor(host).querySelector('.to-remove')).not.toBeNull();

    host.removePlugin();
    host.value = 'hello world';

    await waitRender();

    expect(getEditor(host).querySelector('.to-remove')).toBeNull();
  });

  test('plugin.destroy() is called on removePlugin()', async () => {
    const host = await renderTextarea();

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

  test('api.adoptStyleSheet() adds a stylesheet to the shadow root', async () => {
    const host = await renderTextarea();

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
    const host = await renderTextarea();

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
  test('addPattern() returns a string id', async () => {
    const host = await renderTextarea();

    const id = host.addPattern({ pattern: /hello/g, className: 'hi' });

    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  test('addPattern() renders mark spans for matching text', async () => {
    const host = await renderTextarea();

    host.addPattern({ pattern: /hello/g, className: 'hi-mark' });
    host.value = 'hello world';

    await waitRender();

    const mark = getEditor(host).querySelector('.hi-mark');

    expect(mark).not.toBeNull();
    expect(mark!.textContent).toBe('hello');
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

  test('pattern with formatting properties renders inline styles', async () => {
    const host = await renderTextarea();

    host.addPattern({
      pattern: /bold/g,
      className: 'bold-mark',
      bold: true,
      color: '#ff0000',
    });
    host.value = 'this is bold text';

    await waitRender();

    const mark = getEditor(host).querySelector('.bold-mark') as HTMLElement | null;

    expect(mark).not.toBeNull();
    expect(mark!.style.fontWeight).toBe('bold');
    expect(mark!.style.color).toBe('rgb(255, 0, 0)');
  });

  test('createLineDecoration on a pattern applies class to the correct line', async () => {
    const host = await renderTextarea();

    host.addPattern({
      pattern: /ERROR/g,
      className: 'err-mark',
      createLineDecoration: () => ({ className: 'err-line' }),
    });
    host.value = 'ok\nERROR here\nok';

    await waitRender();

    const lines = getEditor(host).querySelectorAll('.line');

    expect(lines[1].classList.contains('err-line')).toBe(true);
    expect(lines[0].classList.contains('err-line')).toBe(false);
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

  test('out-of-range mark decoration does not crash', async () => {
    const host = await renderTextarea();

    host.usePlugin({
      update(_value, api) {
        api.setDecorations([{ type: 'mark', from: 100, to: 200, className: 'oob' }]);
      },
    });

    host.value = 'short';

    await waitRender();

    expect(getEditor(host).querySelector('.oob')).toBeNull();
  });

  test('out-of-range line decoration does not crash', async () => {
    const host = await renderTextarea();

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

describe('RCTextarea — paste', () => {
  test('pasting single-line text into an empty editor sets the value', async () => {
    const host = await renderTextarea();

    simulatePaste(getEditor(host), 'hello world');

    await waitRender();

    expect(host.value).toBe('hello world');
    expect(getEditor(host).querySelectorAll('.line')).toHaveLength(1);
  });

  test('pasting multi-line text into an empty editor preserves newlines', async () => {
    const host = await renderTextarea();

    simulatePaste(getEditor(host), 'line one\nline two\nline three');

    await waitRender();

    expect(host.value).toBe('line one\nline two\nline three');

    const lines = getEditor(host).querySelectorAll('.line');

    expect(lines).toHaveLength(3);
    expect(lines[0].textContent).toBe('line one');
    expect(lines[1].textContent).toBe('line two');
    expect(lines[2].textContent).toBe('line three');
  });

  test('pasting text with \\r\\n line endings normalizes to \\n', async () => {
    const host = await renderTextarea();

    simulatePaste(getEditor(host), 'first\r\nsecond\r\nthird');

    await waitRender();

    expect(host.value).toBe('first\nsecond\nthird');
    expect(getEditor(host).querySelectorAll('.line')).toHaveLength(3);
  });

  test('pasting text with legacy \\r line endings normalizes to \\n', async () => {
    const host = await renderTextarea();

    simulatePaste(getEditor(host), 'a\rb\rc');

    await waitRender();

    expect(host.value).toBe('a\nb\nc');
    expect(getEditor(host).querySelectorAll('.line')).toHaveLength(3);
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
