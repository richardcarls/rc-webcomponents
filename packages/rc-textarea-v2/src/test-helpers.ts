import type { RCTextareaV2 } from './rc-textarea-v2.ts';

// ── Shadow DOM helpers ────────────────────────────────────────────────────────

export function getEditor(host: RCTextareaV2): HTMLDivElement {
  return host.shadowRoot!.querySelector('#editor') as HTMLDivElement;
}

export function getLineNumbers(host: RCTextareaV2): HTMLDivElement {
  return host.shadowRoot!.querySelector('#line-numbers') as HTMLDivElement;
}

export function getSlottedTextarea(host: RCTextareaV2): HTMLTextAreaElement {
  return host.querySelector('textarea') as HTMLTextAreaElement;
}

/**
 * Wait one animation frame for _performRender to start, then flush one microtask
 * tick so that synchronous plugin `update()` calls complete before the test asserts.
 */
export async function waitRender(): Promise<void> {
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  // Flush microtasks queued during the render (e.g. `await plugin.update(...)`)
  await Promise.resolve();
}

/**
 * Dispatches a synthetic paste event carrying plain text onto `editor`.
 *
 * Using a plain Event + manual clipboardData override because `new ClipboardEvent`
 * with a DataTransfer in the init dict is not reliable across browsers (Firefox
 * ignores the init's clipboardData). The paste handler only calls
 * `e.clipboardData?.getData('text/plain')`, so a minimal duck-typed mock is enough.
 */
export function simulatePaste(editor: HTMLElement, text: string): void {
  // Focus is required for execCommand('insertText') (the single-line code path)
  // to actually modify the contenteditable DOM in Firefox.
  editor.focus();
  const event = Object.assign(
    new Event('paste', { bubbles: true, cancelable: true }),
    { clipboardData: { getData: (type: string) => type === 'text/plain' ? text : '' } },
  ) as ClipboardEvent;
  editor.dispatchEvent(event);
}
