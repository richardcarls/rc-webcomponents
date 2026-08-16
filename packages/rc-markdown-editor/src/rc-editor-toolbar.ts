import { LitElement, html, nothing, type SVGTemplateResult, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

import '@rcarls/rc-button/define';
import '@rcarls/rc-select/define';
import '@rcarls/rc-toolbar/define';
import { icons } from './icons.ts';
import type { EditorToolbarAction, EditorToolbarActionDetail, HeadingLevel } from './types.ts';

const HEADING_OPTIONS: Array<{ value: HeadingLevel | 'p'; label: string }> = [
  { value: 'p', label: 'Paragraph' },
  { value: 'h1', label: 'Heading 1' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
  { value: 'h4', label: 'Heading 4' },
  { value: 'h5', label: 'Heading 5' },
  { value: 'h6', label: 'Heading 6' },
];

/**
 * Formatting toolbar for `<rc-markdown-editor>`. Renders themed `rc-button`,
 * `rc-select`, and `rc-toolbar` controls into its own light DOM so the parent
 * editor can provide their shared appearance.
 *
 * Active-format properties are set by the parent editor and reflected as
 * `aria-pressed` on the corresponding buttons. Heading level is shown via an
 * `<rc-select>`. Code-block language is shown via a `<input>` when active.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-markdown-editor rc-markdown-editor docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/ WAI-ARIA Toolbar pattern}
 *
 * @fires rc-toolbar-action - When a formatting button or select is activated.
 *
 * @attr label - Accessible label applied to the `rc-toolbar` container.
 * @attr active-bold - Reflects Bold as active at the cursor.
 * @attr active-italic - Reflects Italic as active at the cursor.
 * @attr active-underline - Reflects Underline as active at the cursor.
 * @attr active-strikethrough - Reflects Strikethrough as active at the cursor.
 * @attr active-code - Reflects inline Code as active at the cursor.
 * @attr active-link - Reflects Link as active at the cursor.
 * @attr active-heading - Heading level active at the cursor, or absent for paragraph text.
 * @attr active-blockquote - Reflects Blockquote as active at the cursor.
 * @attr active-bullet-list - Reflects Bullet List as active at the cursor.
 * @attr active-ordered-list - Reflects Ordered List as active at the cursor.
 * @attr active-code-block - Reflects Code Block as active at the cursor.
 * @attr code-language - Language of the code block at the cursor; absent when not in a code block.
 * @attr source-mode - Whether the parent editor is in source mode.
 */
export class RcEditorToolbar extends LitElement {
  /** Accessible label applied to the `rc-toolbar` container. */
  @property({ type: String })
  label = 'Formatting';

  /** Whether Bold formatting is active at the cursor. */
  @property({ type: Boolean, reflect: true, attribute: 'active-bold' })
  activeBold = false;

  /** Whether Italic formatting is active at the cursor. */
  @property({ type: Boolean, reflect: true, attribute: 'active-italic' })
  activeItalic = false;

  /** Whether Underline formatting is active at the cursor. */
  @property({ type: Boolean, reflect: true, attribute: 'active-underline' })
  activeUnderline = false;

  /** Whether Strikethrough formatting is active at the cursor. */
  @property({ type: Boolean, reflect: true, attribute: 'active-strikethrough' })
  activeStrikethrough = false;

  /** Whether inline Code formatting is active at the cursor. */
  @property({ type: Boolean, reflect: true, attribute: 'active-code' })
  activeCode = false;

  /** Whether the cursor is inside a Link. */
  @property({ type: Boolean, reflect: true, attribute: 'active-link' })
  activeLink = false;

  /** Heading level active at the cursor, or `null` for paragraph text. */
  @property({ attribute: 'active-heading' })
  activeHeading: HeadingLevel | null = null;

  /** Whether the cursor is inside a Blockquote. */
  @property({ type: Boolean, reflect: true, attribute: 'active-blockquote' })
  activeBlockquote = false;

  /** Whether the cursor is inside a Bullet List. */
  @property({ type: Boolean, reflect: true, attribute: 'active-bullet-list' })
  activeBulletList = false;

  /** Whether the cursor is inside an Ordered List. */
  @property({ type: Boolean, reflect: true, attribute: 'active-ordered-list' })
  activeOrderedList = false;

  /** Whether the cursor is inside a Code Block. */
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

  @state()
  protected _langInputValue = '';

  override createRenderRoot(): HTMLElement {
    return this;
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('codeLanguage') && this.codeLanguage !== null) {
      this._langInputValue = this.codeLanguage;
    }
  }

  protected _dispatch(
    action: EditorToolbarAction,
    extra?: Partial<EditorToolbarActionDetail>,
  ): void {
    this.dispatchEvent(
      new CustomEvent<EditorToolbarActionDetail>('rc-toolbar-action', {
        bubbles: true,
        composed: true,
        detail: { action, ...extra },
      }),
    );
  }

  protected _onClick = (e: MouseEvent) => {
    const $btn = (e.target as Element).closest<HTMLButtonElement>('button[data-action]');

    if (!$btn) {
      return;
    }

    this._dispatch($btn.dataset['action'] as EditorToolbarAction);
  };

  protected _onHeadingChange = (e: Event) => {
    const value = (e as CustomEvent<{ value: string }>).detail.value as HeadingLevel | 'p';

    this._dispatch('heading', { headingLevel: value === 'p' ? null : value });
  };

  protected _onLangInput = (e: Event) => {
    this._langInputValue = (e.target as HTMLInputElement).value;
  };

  protected _onLangCommit = () => {
    this._dispatch('code-block-language', { codeLanguage: this._langInputValue.trim() });
  };

  protected _onLangKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._onLangCommit();
    }
  };

  protected _renderActionButton(
    action: EditorToolbarAction,
    label: string,
    title: string,
    active: boolean,
    icon: SVGTemplateResult,
  ): TemplateResult {
    return html`
      <rc-button icon-only class=${active ? 'toolbar-active' : nothing}>
        <button
          type="button"
          data-action=${action}
          title=${title}
          aria-label=${label}
          aria-pressed=${String(active)}
        >
          <span data-rc-button-icon>${icon}</span>
        </button>
      </rc-button>
    `;
  }

  override render() {
    return html`
      <rc-toolbar label=${this.label} @click=${this._onClick}>
        ${this._renderActionButton('bold', 'Bold', 'Bold (Ctrl+B)', this.activeBold, icons.bold)}
        ${this._renderActionButton(
          'italic',
          'Italic',
          'Italic (Ctrl+I)',
          this.activeItalic,
          icons.italic,
        )}
        ${this._renderActionButton(
          'underline',
          'Underline',
          'Underline (Ctrl+U)',
          this.activeUnderline,
          icons.underline,
        )}
        ${this._renderActionButton(
          'strikethrough',
          'Strikethrough',
          'Strikethrough',
          this.activeStrikethrough,
          icons.strikethrough,
        )}
        ${this._renderActionButton(
          'code',
          'Inline Code',
          'Inline Code (Ctrl+`)',
          this.activeCode,
          icons.code,
        )}
        ${this._renderActionButton('link', 'Link', 'Link (Ctrl+K)', this.activeLink, icons.link)}

        <rc-select
          title="Heading level"
          placeholder="Heading level"
          class=${this.activeHeading ? 'toolbar-active' : ''}
          .value=${this.activeHeading ?? 'p'}
          @rc-select-change=${this._onHeadingChange}
        >
          <select aria-label="Heading level">
            ${HEADING_OPTIONS.map(
              ({ value, label }) => html` <option value=${value}>${label}</option> `,
            )}
          </select>
        </rc-select>

        ${this._renderActionButton(
          'blockquote',
          'Blockquote',
          'Blockquote',
          this.activeBlockquote,
          icons.blockquote,
        )}
        ${this._renderActionButton(
          'bullet-list',
          'Bullet List',
          'Bullet List',
          this.activeBulletList,
          icons.bulletList,
        )}
        ${this._renderActionButton(
          'ordered-list',
          'Ordered List',
          'Ordered List',
          this.activeOrderedList,
          icons.orderedList,
        )}
        ${this._renderActionButton(
          'code-block',
          'Code Block',
          'Code Block',
          this.activeCodeBlock,
          icons.codeBlock,
        )}
        ${this.activeCodeBlock && this.codeLanguage !== null
          ? html`
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
            `
          : nothing}
        ${this._renderActionButton(
          'source',
          'Source Mode',
          'Toggle Markdown Source (Ctrl+Shift+S)',
          this.sourceMode,
          icons.source,
        )}
      </rc-toolbar>
    `;
  }
}
