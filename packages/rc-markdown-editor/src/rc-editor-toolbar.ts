import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';

import type { EditorToolbarAction, EditorToolbarActionDetail, HeadingLevel } from './types.ts';


/**
 * Formatting toolbar for `<rc-markdown-editor>`. Dispatches `rc-toolbar-action`
 * events when buttons are clicked. Renders into its own light DOM so the parent
 * shadow stylesheet can target `rc-editor-toolbar button` directly.
 *
 * Active-format properties are set by the parent editor and reflected as
 * `aria-pressed` on the corresponding buttons.
 *
 * @fires rc-toolbar-action - When a formatting button is activated.
 */
export class RcEditorToolbar extends LitElement {
  /** `aria-label` applied to the `[role="toolbar"]` container. */
  @property({ type: String }) label = 'Formatting';

  @property({ type: Boolean, reflect: true, attribute: 'active-bold' })
  activeBold = false;

  @property({ type: Boolean, reflect: true, attribute: 'active-italic' })
  activeItalic = false;

  @property({ type: Boolean, reflect: true, attribute: 'active-code' })
  activeCode = false;

  @property({ attribute: 'active-heading' })
  activeHeading: HeadingLevel | null = null;

  @property({ type: Boolean, reflect: true, attribute: 'active-blockquote' })
  activeBlockquote = false;

  @property({ type: Boolean, reflect: true, attribute: 'active-bullet-list' })
  activeBulletList = false;

  @property({ type: Boolean, reflect: true, attribute: 'active-ordered-list' })
  activeOrderedList = false;

  @property({ type: Boolean, reflect: true, attribute: 'active-code-block' })
  activeCodeBlock = false;

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
    const p = (v: boolean) => String(v) as 'true' | 'false';

    return html`
      <div role="toolbar" aria-label=${this.label} @click=${this._onClick}>
        <button type="button" data-action="bold"
          aria-label="Bold (Ctrl+B)" aria-pressed=${p(this.activeBold)}
        ><b>B</b></button>

        <button type="button" data-action="italic"
          aria-label="Italic (Ctrl+I)" aria-pressed=${p(this.activeItalic)}
        ><i>I</i></button>

        <button type="button" data-action="code"
          aria-label="Inline Code (Ctrl+\`)" aria-pressed=${p(this.activeCode)}
        >&#96;&#96;</button>

        <button type="button" data-action="link"
          aria-label="Link (Ctrl+K)"
        >Link</button>

        <button type="button" data-action="heading"
          aria-label="Toggle Heading (H1)" aria-pressed=${p(!!this.activeHeading)}
        >H</button>

        <button type="button" data-action="blockquote"
          aria-label="Blockquote" aria-pressed=${p(this.activeBlockquote)}
        >&ldquo;</button>

        <button type="button" data-action="bullet-list"
          aria-label="Bullet List" aria-pressed=${p(this.activeBulletList)}
        >&#x2022;&#x2014;</button>

        <button type="button" data-action="ordered-list"
          aria-label="Ordered List" aria-pressed=${p(this.activeOrderedList)}
        >1&#x2014;</button>

        <button type="button" data-action="code-block"
          aria-label="Code Block" aria-pressed=${p(this.activeCodeBlock)}
        >&#96;&#96;&#96;</button>

        <button type="button" data-action="source"
          aria-label="Toggle Markdown Source (Ctrl+Shift+S)" aria-pressed=${p(this.sourceMode)}
        >Source</button>
      </div>
    `;
  }
}
