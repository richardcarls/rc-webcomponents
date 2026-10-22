import { LitElement, html, nothing, type SVGTemplateResult, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

import '@rcarls/rc-button/define';
import { MessagesController } from '@rcarls/rc-common';
import '@rcarls/rc-toolbar/define';
import { icons } from './icons.js';
import type { EditorToolbarAction, EditorToolbarActionDetail, HeadingLevel } from './types.js';

const HEADING_LEVELS: readonly HeadingLevel[] = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

/** Built-in text of `rc-editor-toolbar`. */
export interface RCEditorToolbarMessages {
  /** Accessible name of the toolbar. */
  toolbar: string;
  bold: string;
  italic: string;
  underline: string;
  strikethrough: string;
  inlineCode: string;
  link: string;
  headingLevel: string;
  paragraph: string;
  heading: (level: number) => string;
  blockquote: string;
  bulletList: string;
  orderedList: string;
  codeBlock: string;
  codeBlockLanguage: string;
  /** Placeholder of the code block language input. */
  languagePlaceholder: string;
  /** Tooltip of the code block language input. */
  languageHint: string;
  sourceMode: string;
  /** Tooltip of the source mode button, before its shortcut. */
  sourceModeHint: string;
  /** A tooltip with its keyboard shortcut, such as `Bold (Ctrl+B)`. */
  shortcut: (label: string, keys: string) => string;
}

export const DEFAULT_EDITOR_TOOLBAR_MESSAGES: Readonly<RCEditorToolbarMessages> = Object.freeze({
  toolbar: 'Formatting',
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  strikethrough: 'Strikethrough',
  inlineCode: 'Inline Code',
  link: 'Link',
  headingLevel: 'Heading level',
  paragraph: 'Paragraph',
  heading: (level: number) => `Heading ${level}`,
  blockquote: 'Blockquote',
  bulletList: 'Bullet List',
  orderedList: 'Ordered List',
  codeBlock: 'Code Block',
  codeBlockLanguage: 'Code block language',
  languagePlaceholder: 'Language',
  languageHint: 'Syntax language (e.g. TypeScript, Rust)',
  sourceMode: 'Source Mode',
  sourceModeHint: 'Toggle Markdown Source',
  shortcut: (label: string, keys: string) => `${label} (${keys})`,
});

declare module '@rcarls/rc-common' {
  interface RcMessageCatalog {
    'rc-editor-toolbar': RCEditorToolbarMessages;
  }
}

/**
 * Formatting toolbar for `<rc-markdown-editor>`. Renders themed `rc-button` and
 * `rc-toolbar` controls into its own light DOM so the parent editor can provide
 * their shared appearance.
 *
 * Active-format properties are set by the parent editor and reflected as
 * `aria-pressed` on the corresponding buttons. Heading level is shown via a
 * native `<select>`. Code-block language is shown via a `<input>` when active.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-markdown-editor rc-markdown-editor docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/ WAI-ARIA Toolbar pattern}
 *
 * Built-in text follows the element's own `lang`, else `<html lang>`: per
 * element through `messages`, or for every toolbar through
 * `registerMessages()` from `@rcarls/rc-common` under `rc-editor-toolbar`.
 *
 * @fires rc-toolbar-action - When a formatting button or select is activated.
 *
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
  /** Built-in text overrides; unset keys fall back to registered text, then English. */
  @property({ attribute: false })
  messages: Partial<RCEditorToolbarMessages> | undefined;

  private readonly _messages = new MessagesController(
    this,
    'rc-editor-toolbar',
    DEFAULT_EDITOR_TOOLBAR_MESSAGES,
    { overrides: () => this.messages },
  );

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
    const value = (e.target as HTMLSelectElement).value as HeadingLevel | 'p';

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
    const m = this._messages.value;
    const headingOptions: Array<{ value: HeadingLevel | 'p'; label: string }> = [
      { value: 'p', label: m.paragraph },
      ...HEADING_LEVELS.map((value, index) => ({ value, label: m.heading(index + 1) })),
    ];

    return html`
      <rc-toolbar label=${m.toolbar} @click=${this._onClick}>
        ${this._renderActionButton(
          'bold',
          m.bold,
          m.shortcut(m.bold, 'Ctrl+B'),
          this.activeBold,
          icons.bold,
        )}
        ${this._renderActionButton(
          'italic',
          m.italic,
          m.shortcut(m.italic, 'Ctrl+I'),
          this.activeItalic,
          icons.italic,
        )}
        ${this._renderActionButton(
          'underline',
          m.underline,
          m.shortcut(m.underline, 'Ctrl+U'),
          this.activeUnderline,
          icons.underline,
        )}
        ${this._renderActionButton(
          'strikethrough',
          m.strikethrough,
          m.strikethrough,
          this.activeStrikethrough,
          icons.strikethrough,
        )}
        ${this._renderActionButton(
          'code',
          m.inlineCode,
          m.shortcut(m.inlineCode, 'Ctrl+`'),
          this.activeCode,
          icons.code,
        )}
        ${this._renderActionButton(
          'link',
          m.link,
          m.shortcut(m.link, 'Ctrl+K'),
          this.activeLink,
          icons.link,
        )}

        <select
          class=${this.activeHeading ? 'heading-select toolbar-active' : 'heading-select'}
          title=${m.headingLevel}
          aria-label=${m.headingLevel}
          @change=${this._onHeadingChange}
        >
          ${headingOptions.map(
            ({ value, label }) => html`
              <option value=${value} .selected=${value === (this.activeHeading ?? 'p')}>
                ${label}
              </option>
            `,
          )}
        </select>

        ${this._renderActionButton(
          'blockquote',
          m.blockquote,
          m.blockquote,
          this.activeBlockquote,
          icons.blockquote,
        )}
        ${this._renderActionButton(
          'bullet-list',
          m.bulletList,
          m.bulletList,
          this.activeBulletList,
          icons.bulletList,
        )}
        ${this._renderActionButton(
          'ordered-list',
          m.orderedList,
          m.orderedList,
          this.activeOrderedList,
          icons.orderedList,
        )}
        ${this._renderActionButton(
          'code-block',
          m.codeBlock,
          m.codeBlock,
          this.activeCodeBlock,
          icons.codeBlock,
        )}
        ${this.activeCodeBlock && this.codeLanguage !== null
          ? html`
              <input
                type="text"
                class="lang-input"
                aria-label=${m.codeBlockLanguage}
                placeholder=${m.languagePlaceholder}
                title=${m.languageHint}
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
          m.sourceMode,
          m.shortcut(m.sourceModeHint, 'Ctrl+Shift+S'),
          this.sourceMode,
          icons.source,
        )}
      </rc-toolbar>
    `;
  }
}
