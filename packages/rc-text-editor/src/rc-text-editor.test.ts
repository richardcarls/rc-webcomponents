import { test, expect, describe, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './define.ts';
import type { RcTextEditor } from './rc-text-editor.ts';
import { expectNoA11yViolations } from '../../../test-helpers/a11y.ts';


function getEditorEl(host: RcTextEditor): HTMLElement {
  return host.shadowRoot!.querySelector('#editor') as HTMLElement;
}

function getPreviewEl(host: RcTextEditor): HTMLElement {
  return host.shadowRoot!.querySelector('#rte-preview') as HTMLElement;
}

function getToolbarEl(host: RcTextEditor): HTMLElement | null {
  return host.shadowRoot!.querySelector('rc-editor-toolbar');
}

describe('RcTextEditor — toolbar', () => {
  test('renders toolbar by default (toolbar=true)', async () => {
    const screen = render(html`
      <rc-text-editor data-testid="host" label="Notes"></rc-text-editor>
    `);
    const host = screen.getByTestId('host').element() as RcTextEditor;
    await host.updateComplete;

    expect(getToolbarEl(host)).not.toBeNull();
  });

  test('hides toolbar when toolbar=false', async () => {
    const screen = render(html`
      <rc-text-editor data-testid="host" label="Notes" .toolbar=${false}></rc-text-editor>
    `);
    const host = screen.getByTestId('host').element() as RcTextEditor;
    await host.updateComplete;

    expect(getToolbarEl(host)).toBeNull();
  });
});

describe('RcTextEditor — progressive enhancement', () => {
  test('consumer <label for> still resolves to slotted <textarea>', async () => {
    const screen = render(html`
      <rc-text-editor data-testid="host">
        <label for="notes-input">Notes</label>
        <textarea id="notes-input" name="notes"></textarea>
      </rc-text-editor>
    `);
    const host = screen.getByTestId('host').element() as RcTextEditor;
    await host.updateComplete;

    const labelEl = host.querySelector<HTMLLabelElement>('label[for="notes-input"]');
    const textareaEl = host.querySelector<HTMLTextAreaElement>('textarea#notes-input');
    expect(labelEl?.control).toBe(textareaEl);
  });

  test('consumer <textarea> remains connected after upgrade', async () => {
    const screen = render(html`
      <rc-text-editor data-testid="host">
        <textarea id="notes" name="notes"></textarea>
      </rc-text-editor>
    `);
    const host = screen.getByTestId('host').element() as RcTextEditor;
    await host.updateComplete;

    const textarea = host.querySelector<HTMLTextAreaElement>('textarea#notes');
    expect(textarea?.isConnected).toBe(true);
    expect(textarea?.getAttribute('name')).toBe('notes');
  });
});

describe('RcTextEditor — preview mode', () => {
  test('preview=true shows #rte-preview', async () => {
    const screen = render(html`
      <rc-text-editor data-testid="host" label="Notes"></rc-text-editor>
    `);
    const host = screen.getByTestId('host').element() as RcTextEditor;
    await host.updateComplete;

    host.preview = true;
    await host.updateComplete;

    expect(getPreviewEl(host).hidden).toBe(false);
  });

  test('preview=false hides #rte-preview', async () => {
    const screen = render(html`
      <rc-text-editor data-testid="host" label="Notes" .preview=${true}></rc-text-editor>
    `);
    const host = screen.getByTestId('host').element() as RcTextEditor;
    await host.updateComplete;

    host.preview = false;
    await host.updateComplete;

    expect(getPreviewEl(host).hidden).toBe(true);
  });

  test('dispatches rc-preview-change when preview toggled', async () => {
    const screen = render(html`
      <rc-text-editor data-testid="host" label="Notes"></rc-text-editor>
    `);
    const host = screen.getByTestId('host').element() as RcTextEditor;
    await host.updateComplete;

    const received: boolean[] = [];
    host.addEventListener('rc-preview-change', (e) => {
      received.push((e as CustomEvent<{ preview: boolean }>).detail.preview);
    });

    host.preview = true;
    await host.updateComplete;
    host.preview = false;
    await host.updateComplete;

    expect(received).toEqual([true, false]);
  });

  test('does not dispatch rc-preview-change when set to same value', async () => {
    const screen = render(html`
      <rc-text-editor data-testid="host" label="Notes"></rc-text-editor>
    `);
    const host = screen.getByTestId('host').element() as RcTextEditor;
    await host.updateComplete;

    const handler = vi.fn();
    host.addEventListener('rc-preview-change', handler);

    host.preview = false;
    await host.updateComplete;
    host.preview = false;
    await host.updateComplete;

    expect(handler).not.toHaveBeenCalled();
  });

  test('defaultPreview sets initial state without firing rc-preview-change', async () => {
    const screen = render(html`
      <rc-text-editor data-testid="host" label="Notes" .defaultPreview=${true}></rc-text-editor>
    `);
    const host = screen.getByTestId('host').element() as RcTextEditor;

    const handler = vi.fn();
    host.addEventListener('rc-preview-change', handler);

    await host.updateComplete;

    expect(host.preview).toBe(true);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('RcTextEditor — formatting shortcuts', () => {
  test('Ctrl+B wraps selection in **', async () => {
    const screen = render(html`
      <rc-text-editor data-testid="host" label="Notes">
        <textarea id="notes"></textarea>
      </rc-text-editor>
    `);
    const host = screen.getByTestId('host').element() as RcTextEditor;
    await host.updateComplete;

    host.value = 'hello world';

    // Simulate selection of "hello" (offsets 0–5) via _savedSelection
    host['_savedSelection'] = { anchorOffset: 0, focusOffset: 5 };

    host.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true }),
    );
    await host.updateComplete;

    expect(host.value).toBe('**hello** world');
  });

  test('toolbar bold action wraps selection in **', async () => {
    const screen = render(html`
      <rc-text-editor data-testid="host" label="Notes">
        <textarea id="notes"></textarea>
      </rc-text-editor>
    `);
    const host = screen.getByTestId('host').element() as RcTextEditor;
    await host.updateComplete;

    host.value = 'hello world';
    host['_savedSelection'] = { anchorOffset: 0, focusOffset: 5 };

    host.dispatchEvent(
      new CustomEvent('rc-toolbar-action', {
        bubbles: true,
        detail: { action: 'bold' },
      }),
    );
    await host.updateComplete;

    expect(host.value).toBe('**hello** world');
  });
});

describe('RcTextEditor — accessibility', () => {
  test('has no automated accessibility violations in edit mode', async () => {
    const screen = render(html`
      <rc-text-editor data-testid="host">
        <label for="notes">Notes</label>
        <textarea id="notes" name="notes"></textarea>
      </rc-text-editor>
    `);
    const host = screen.getByTestId('host').element() as RcTextEditor;
    await host.updateComplete;

    await expectNoA11yViolations(host);
  });

  test('has no automated accessibility violations in preview mode', async () => {
    const screen = render(html`
      <rc-text-editor data-testid="host">
        <label for="notes">Notes</label>
        <textarea id="notes" name="notes"></textarea>
      </rc-text-editor>
    `);
    const host = screen.getByTestId('host').element() as RcTextEditor;
    await host.updateComplete;

    host.preview = true;
    await host.updateComplete;

    await expectNoA11yViolations(host);

    host.preview = false;
    await host.updateComplete;
  });

  test('#editor div is present in shadow root', async () => {
    const screen = render(html`
      <rc-text-editor data-testid="host" label="Notes"></rc-text-editor>
    `);
    const host = screen.getByTestId('host').element() as RcTextEditor;
    await host.updateComplete;

    expect(getEditorEl(host)).not.toBeNull();
  });
});
