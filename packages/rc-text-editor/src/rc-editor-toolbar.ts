import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';

import type { EditorToolbarAction, EditorToolbarActionDetail } from './types.ts';


/**
 * Formatting toolbar for `<rc-text-editor>`. Dispatches `rc-toolbar-action` events
 * when buttons are clicked. Renders into its own light DOM so `rc-text-editor`'s
 * shadow stylesheet can target the buttons directly via `rc-editor-toolbar button`.
 *
 * @fires rc-toolbar-action - When a formatting button is activated.
 */
export class RcEditorToolbar extends LitElement {
  /** `aria-label` applied to the `[role="toolbar"]` container. */
  @property({ type: String })
  label = 'Formatting';

  override createRenderRoot() {
    return this;
  }

  private _onClick = (e: MouseEvent): void => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('button[data-action]');
    if (!btn) return;

    const action = btn.dataset['action'] as EditorToolbarAction;

    this.dispatchEvent(
      new CustomEvent<EditorToolbarActionDetail>('rc-toolbar-action', {
        bubbles: true,
        detail: { action },
      }),
    );
  };

  override render() {
    return html`
      <div role="toolbar" aria-label=${this.label} @click=${this._onClick}>
        <button type="button" data-action="bold"    aria-label="Bold (Ctrl+B)"><b>B</b></button>
        <button type="button" data-action="italic"  aria-label="Italic (Ctrl+I)"><i>I</i></button>
        <button type="button" data-action="code"    aria-label="Inline Code">&#96;&#96;</button>
        <button type="button" data-action="link"    aria-label="Link (Ctrl+K)">Link</button>
        <button type="button" data-action="heading" aria-label="Heading">H</button>
        <button type="button" data-action="preview" aria-label="Toggle Preview (Ctrl+Shift+P)">Preview</button>
      </div>
    `;
  }
}
