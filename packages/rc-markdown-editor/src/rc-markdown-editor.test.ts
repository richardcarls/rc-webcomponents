import { describe, expect, test } from 'vitest';
import { html } from 'lit';
import { render } from 'vitest-browser-lit';

import './define.ts';
import type { RcMarkdownEditor } from './rc-markdown-editor.ts';

describe('RcMarkdownEditor value ownership', () => {
  test('value attribute seeds the initial value declaratively', async () => {
    const screen = render(html`
      <rc-markdown-editor value="## Attribute Seeded" data-testid="host"></rc-markdown-editor>
    `);
    const host = screen.getByTestId('host').element() as RcMarkdownEditor;

    await host.updateComplete;

    expect(host.value).toBe('## Attribute Seeded');
  });

  test('ignores initialization changes from the hidden source editor', async () => {
    const initialValue = '## Storage\nKeep chilled.';
    const screen = render(html`
      <rc-markdown-editor .value=${initialValue} data-testid="host">
        <label for="notes">Recipe Notes</label>
        <textarea id="notes" name="notes"></textarea>
      </rc-markdown-editor>
    `);
    const host = screen.getByTestId('host').element() as RcMarkdownEditor;

    await host.updateComplete;

    const source = host.shadowRoot!.querySelector<HTMLElement & { value: string }>(
      '#source-editor',
    )!;

    expect(host.sourceMode).toBe(false);
    expect(host.value).toBe(initialValue);

    source.value = '';

    source.dispatchEvent(
      new CustomEvent('rc-change', {
        bubbles: true,
        composed: true,
        detail: { value: '' },
      }),
    );

    expect(host.value).toBe(initialValue);
    expect(host.shadowRoot!.querySelector('#rich-view')?.textContent).toContain('Storage');
  });

  test('preserves supported inline Markdown HTML without rendering unsafe markup', async () => {
    const screen = render(html`
      <rc-markdown-editor
        .value=${'<u>Family</u><img src=x onerror=alert(1)>'}
        read-only
        data-testid="host"
      ></rc-markdown-editor>
    `);
    const host = screen.getByTestId('host').element() as RcMarkdownEditor;

    await host.updateComplete;

    const richView = host.shadowRoot!.querySelector('#rich-view')!;

    expect(richView.querySelector('u')?.textContent).toBe('Family');
    expect(richView.querySelector('img')).toBeNull();
    expect(richView.innerHTML).not.toContain('onerror');
  });

  test('focuses and protects the source surface when source mode is active', async () => {
    const screen = render(html`
      <rc-markdown-editor .value=${'## Notes'} source-mode data-testid="host">
        <label for="notes">Recipe Notes</label>
        <textarea id="notes" name="notes"></textarea>
      </rc-markdown-editor>
    `);
    const host = screen.getByTestId('host').element() as RcMarkdownEditor;

    await host.updateComplete;

    const source = host.shadowRoot!.querySelector<HTMLElement>('#source-editor')!;
    const label = host.querySelector('label')!;

    label.click();

    expect(host.shadowRoot!.activeElement).toBe(source);

    host.readOnly = true;
    await host.updateComplete;

    expect(source).toHaveAttribute('read-only');
  });
});
