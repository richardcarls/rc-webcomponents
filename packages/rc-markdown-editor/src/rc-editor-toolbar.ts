import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';

import type { EditorToolbarAction, EditorToolbarActionDetail, HeadingLevel } from './types.ts';


/**
 * Formatting toolbar for `<rc-markdown-editor>`. Dispatches `rc-toolbar-action`
 * events when buttons are clicked. Renders into its own light DOM so the parent
 * shadow stylesheet can target `rc-editor-toolbar button` directly.
 *
 * Active-format properties (`activeBold`, `activeItalic`, `activeCode`,
 * `activeHeading`) are set by the parent editor and reflected as
 * `aria-pressed` on the corresponding buttons.
 *
 * @fires rc-toolbar-action - When a formatting button is activated.
 */
export class RcEditorToolbar extends LitElement {
  /** `aria-label` applied to the `[role="toolbar"]` container. */
  @property({ type: String }) label = 'Formatting';

  /** Whether the cursor/selection is currently in bold text. */
  @property({ type: Boolean, reflect: true, attribute: 'active-bold' })
  activeBold = false;

  /** Whether the cursor/selection is currently in italic text. */
  @property({ type: Boolean, reflect: true, attribute: 'active-italic' })
  activeItalic = false;

  /** Whether the cursor/selection is currently in inline code. */
  @property({ type: Boolean, reflect: true, attribute: 'active-code' })
  activeCode = false;

  /** Heading level at the cursor/selection, or null if not in a heading. */
  @property({ attribute: 'active-heading' })
  activeHeading: HeadingLevel | null = null;

  /** Whether the editor is in source mode (toggles the Source button state). */
  @property({ type: Boolean, reflect: true, attribute: 'source-mode' })
  sourceMode = false;

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
        composed: true,
        detail: { action },
      }),
    );
  };

  override render() {
    const boolStr = (v: boolean) => String(v) as 'true' | 'false';

    return html`
      <div role="toolbar" aria-label=${this.label} @click=${this._onClick}>
        <button
          type="button"
          data-action="bold"
          aria-label="Bold (Ctrl+B)"
          aria-pressed=${boolStr(this.activeBold)}
        ><b>B</b></button>

        <button
          type="button"
          data-action="italic"
          aria-label="Italic (Ctrl+I)"
          aria-pressed=${boolStr(this.activeItalic)}
        ><i>I</i></button>

        <button
          type="button"
          data-action="code"
          aria-label="Inline Code (Ctrl+\`)"
          aria-pressed=${boolStr(this.activeCode)}
        >&#96;&#96;</button>

        <button
          type="button"
          data-action="link"
          aria-label="Link (Ctrl+K)"
        >Link</button>

        <button
          type="button"
          data-action="heading"
          aria-label="Toggle Heading (H1)"
          aria-pressed=${boolStr(!!this.activeHeading)}
        >H</button>

        <button
          type="button"
          data-action="source"
          aria-label="Toggle Markdown Source (Ctrl+Shift+S)"
          aria-pressed=${boolStr(this.sourceMode)}
        >Source</button>
      </div>
    `;
  }
}
