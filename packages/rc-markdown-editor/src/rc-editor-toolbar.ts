import { LitElement, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';

import { icons } from './icons.ts';
import type { EditorToolbarAction, EditorToolbarActionDetail, HeadingLevel } from './types.ts';


const HEADING_OPTIONS: Array<{ value: HeadingLevel | ''; label: string }> = [
  { value: '',   label: 'Paragraph' },
  { value: 'h1', label: 'Heading 1' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
  { value: 'h4', label: 'Heading 4' },
  { value: 'h5', label: 'Heading 5' },
  { value: 'h6', label: 'Heading 6' },
];


/**
 * Formatting toolbar for `<rc-markdown-editor>`. Renders into its own light DOM
 * so the parent shadow stylesheet can reach `rc-editor-toolbar button` directly.
 *
 * Active-format properties are set by the parent editor and reflected as
 * `aria-pressed` on the corresponding buttons. Heading level is shown via a
 * `<select>`. Code-block language is shown via a `<input>` when active.
 *
 * @fires rc-toolbar-action - When a formatting button or select is activated.
 */
export class RcEditorToolbar extends LitElement {
  /** `aria-label` applied to the `[role="toolbar"]` container. */
  @property({ type: String }) label = 'Formatting';

  @property({ type: Boolean, reflect: true, attribute: 'active-bold' })
  activeBold = false;

  @property({ type: Boolean, reflect: true, attribute: 'active-italic' })
  activeItalic = false;

  @property({ type: Boolean, reflect: true, attribute: 'active-underline' })
  activeUnderline = false;

  @property({ type: Boolean, reflect: true, attribute: 'active-strikethrough' })
  activeStrikethrough = false;

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

  /**
   * Language of the code block at the cursor. `null` means not in a code block
   * (hides the language input). `''` means no language is set.
   */
  @property({ attribute: 'code-language' })
  codeLanguage: string | null = null;

  /** Whether the editor is in source mode. */
  @property({ type: Boolean, reflect: true, attribute: 'source-mode' })
  sourceMode = false;

  /** Tracks the in-progress language input value before commit. */
  @state() private _langInputValue = '';

  override createRenderRoot() {
    return this;
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has('codeLanguage') && this.codeLanguage !== null) {
      this._langInputValue = this.codeLanguage;
    }
  }

  // ── Event helpers ─────────────────────────────────────────────────────────

  private _dispatch(action: EditorToolbarAction, extra?: Partial<EditorToolbarActionDetail>) {
    this.dispatchEvent(
      new CustomEvent<EditorToolbarActionDetail>('rc-toolbar-action', {
        bubbles: true,
        composed: true,
        detail: { action, ...extra },
      }),
    );
  }

  private _onClick = (e: MouseEvent) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('button[data-action]');
    if (!btn) return;
    this._dispatch(btn.dataset['action'] as EditorToolbarAction);
  };

  private _onHeadingChange = (e: Event) => {
    const value = (e.target as HTMLSelectElement).value as HeadingLevel | '';
    this._dispatch('heading', { headingLevel: value || null });
  };

  private _onLangInput = (e: Event) => {
    this._langInputValue = (e.target as HTMLInputElement).value;
  };

  private _onLangCommit = () => {
    this._dispatch('code-block-language', { codeLanguage: this._langInputValue.trim() });
  };

  private _onLangKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._onLangCommit();
    }
  };

  // ── Rendering ─────────────────────────────────────────────────────────────

  override render() {
    const p = (v: boolean) => String(v) as 'true' | 'false';
    const headingVal = this.activeHeading ?? '';

    return html`
      <div role="toolbar" aria-label=${this.label} @click=${this._onClick}>

        <button type="button" data-action="bold"
          title="Bold (Ctrl+B)" aria-label="Bold" aria-pressed=${p(this.activeBold)}
        >${icons.bold}</button>

        <button type="button" data-action="italic"
          title="Italic (Ctrl+I)" aria-label="Italic" aria-pressed=${p(this.activeItalic)}
        >${icons.italic}</button>

        <button type="button" data-action="underline"
          title="Underline (Ctrl+U)" aria-label="Underline" aria-pressed=${p(this.activeUnderline)}
        >${icons.underline}</button>

        <button type="button" data-action="strikethrough"
          title="Strikethrough" aria-label="Strikethrough" aria-pressed=${p(this.activeStrikethrough)}
        >${icons.strikethrough}</button>

        <button type="button" data-action="code"
          title="Inline Code (Ctrl+\`)" aria-label="Inline Code" aria-pressed=${p(this.activeCode)}
        >${icons.code}</button>

        <button type="button" data-action="link"
          title="Link (Ctrl+K)" aria-label="Link"
        >${icons.link}</button>

        <select
          aria-label="Heading level"
          title="Heading level"
          class=${this.activeHeading ? 'toolbar-active' : ''}
          @change=${this._onHeadingChange}
          .value=${headingVal}
        >
          ${HEADING_OPTIONS.map(({ value, label }) => html`
            <option value=${value} ?selected=${headingVal === value}>${label}</option>
          `)}
        </select>

        <button type="button" data-action="blockquote"
          title="Blockquote" aria-label="Blockquote" aria-pressed=${p(this.activeBlockquote)}
        >${icons.blockquote}</button>

        <button type="button" data-action="bullet-list"
          title="Bullet List" aria-label="Bullet List" aria-pressed=${p(this.activeBulletList)}
        >${icons.bulletList}</button>

        <button type="button" data-action="ordered-list"
          title="Ordered List" aria-label="Ordered List" aria-pressed=${p(this.activeOrderedList)}
        >${icons.orderedList}</button>

        <button type="button" data-action="code-block"
          title="Code Block" aria-label="Code Block" aria-pressed=${p(this.activeCodeBlock)}
        >${icons.codeBlock}</button>

        ${this.activeCodeBlock && this.codeLanguage !== null ? html`
          <input
            type="text"
            class="lang-input"
            aria-label="Code block language"
            placeholder="Language"
            title="Syntax language (e.g. TypeScript, Rust)"
            .value=${this._langInputValue}
            @input=${this._onLangInput}
            @blur=${this._onLangCommit}
            @keydown=${this._onLangKeyDown}
            @click=${(e: Event) => e.stopPropagation()}
          />
        ` : nothing}

        <button type="button" data-action="source"
          title="Toggle Markdown Source (Ctrl+Shift+S)" aria-label="Source Mode"
          aria-pressed=${p(this.sourceMode)}
        >${icons.source}</button>

      </div>
    `;
  }
}
