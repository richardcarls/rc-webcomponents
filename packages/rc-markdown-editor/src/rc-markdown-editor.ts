import { LitElement, html, nothing } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { micromark } from 'micromark';
import { gfmStrikethrough } from 'micromark-extension-gfm-strikethrough';
import TurndownService from 'turndown';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { gfmStrikethroughFromMarkdown } from 'mdast-util-gfm-strikethrough';
import { visit } from 'unist-util-visit';

import type { RCTextarea, RCTextareaPluginAPI, DecorationInput } from '@rcarls/rc-textarea';

import { rmeStyles } from './rc-markdown-editor.styles.ts';
import type {
  ActiveFormats,
  EditorMode,
  EditorToolbarAction,
  EditorToolbarActionDetail,
  HeadingLevel,
} from './types.ts';
import { getFormatsFromDecorations, setCodeBlockLanguage } from './formatting.ts';


// Syntax-highlight stylesheet for the source editor, injected into rc-textarea's
// shadow via adoptStyleSheet. CSS custom properties inherit through the shadow
// boundary so consumers can override individual colors.
const _sourceHighlightSheet = new CSSStyleSheet();
_sourceHighlightSheet.replaceSync(`
  .rme-heading-h1,
  .rme-heading-h2,
  .rme-heading-h3,
  .rme-heading-h4,
  .rme-heading-h5,
  .rme-heading-h6 {
    color: var(--rme-src-heading-color, light-dark(#1d6fc4, #82b4f5));
  }

  .rme-code,
  .rme-code-block {
    color: var(--rme-src-code-color, light-dark(#c94a1a, #f09060));
  }

  .rme-link {
    color: var(--rme-src-link-color, light-dark(#0370b0, #60b8e8));
  }

  .rme-blockquote {
    color: var(--rme-src-blockquote-color, light-dark(#2d7a42, #70b880));
  }

  .rme-list-bullet,
  .rme-list-ordered {
    color: var(--rme-src-list-color, light-dark(#7a5c0a, #d4ac48));
  }

  .rme-strikethrough {
    text-decoration: line-through;
    color: var(--rme-src-dim-color, GrayText);
  }

  .rme-underline {
    text-decoration: underline;
  }
`);


// preserves <u> underline passthrough; renders ~~text~~ as <del>
const MICROMARK_OPTIONS = {
  allowDangerousHtml: true,
  extensions: [gfmStrikethrough()],
};

const MDAST_OPTIONS = {
  extensions: [gfmStrikethrough()],
  mdastExtensions: [gfmStrikethroughFromMarkdown()],
};


const _turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '*',
  strongDelimiter: '**',
});

_turndown.addRule('inlineCode', {
  filter: (node) => node.nodeName === 'CODE' && node.parentElement?.nodeName !== 'PRE',
  replacement: (content) => '`' + content + '`',
});

// Underline: preserve <u> as HTML (no markdown equivalent)
_turndown.addRule('underline', {
  filter: ['u'],
  replacement: (content) => '<u>' + content + '</u>',
});

_turndown.addRule('strikethrough', {
  filter: (node) => ['S', 'DEL', 'STRIKE'].includes(node.nodeName),
  replacement: (content) => '~~' + content + '~~',
});

// Code blocks with language: read data-lang from <pre>, emit fenced block
_turndown.addRule('codeBlockWithLang', {
  filter: (node) => node.nodeName === 'PRE' && !!node.querySelector('code'),
  replacement: (_content, node) => {
    const $pre = node as HTMLElement;
    const $code = $pre.querySelector('code');
    const lang = $pre.dataset['lang'] ?? '';

    return '\n\n```' + lang + '\n' + ($code?.textContent ?? '') + '\n```\n\n';
  },
});


type PartialDecoration = Partial<Omit<DecorationInput, 'type' | 'from' | 'to'>>;

const DECORATION_MAP: Record<string, PartialDecoration> = {

  // className applied per depth in _setupSourcePlugin, not here
  heading:    { bold: true },

  emphasis:   { italic: true },
  strong:     { bold: true },
  inlineCode: { className: 'rme-code' },
  link:       { underline: 'solid', className: 'rme-link' },
  blockquote: { className: 'rme-blockquote' },

  // fenced code block (AST node.type === 'code')
  code:   { className: 'rme-code-block' },

  // GFM ~~text~~ (AST node.type === 'delete')
  delete: { className: 'rme-strikethrough' },

  // list and html (underline) nodes are handled dynamically in _setupSourcePlugin
};


/**
 * Rich/source Markdown editor with a formatting toolbar, backed by rc-textarea.
 *
 * - **Rich mode (default)**: A `contenteditable` div shows micromark-rendered
 *   HTML. DOM mutations are converted back to markdown via turndown and
 *   written to the backing `<textarea>` for form participation.
 * - **Source mode**: An `<rc-textarea>` instance shows the markdown source
 *   with live decorations. Toggle via `source-mode` attribute or Ctrl+Shift+S.
 *
 * Consumer markup follows the same progressive-enhancement contract as
 * `<rc-textarea>`:
 *
 * ```html
 * <rc-markdown-editor>
 *   <label for="body">Content</label>
 *   <textarea id="body" name="body"></textarea>
 * </rc-markdown-editor>
 * ```
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-markdown-editor rc-markdown-editor docs}
 *
 * @fires rc-change          - Value changed. Detail: `{ value: string }`.
 * @fires rc-mode-change     - Mode toggled. Detail: `{ mode: EditorMode }`.
 * @fires rc-formatting-change - Active formats at cursor changed. Detail: `ActiveFormats`.
 *
 * @attr {boolean} toolbar       - Show the formatting toolbar (default: true).
 * @attr {boolean} source-mode   - Controlled: show the markdown source editor.
 * @attr {boolean} default-source-mode - Uncontrolled initial source-mode state.
 * @attr {boolean} read-only     - Make the editor read-only.
 */
export class RcMarkdownEditor extends LitElement {
  static override styles = rmeStyles;

  private _value: string | undefined;
  private _defaultValue = '';
  private _valueInitialized = false;

  @property({ type: String, attribute: 'default-value' })
  get defaultValue(): string { return this._defaultValue; }
  set defaultValue(v: string) {
    this._defaultValue = v;
    if (!this._valueInitialized) this.requestUpdate('defaultValue');
  }

  get value(): string { return this._value ?? this._defaultValue; }
  set value(v: string) {
    const old = this._value;
    this._value = v;
    this._valueInitialized = true;
    if (old !== v) {
      this._syncNativeTextarea();
      this.requestUpdate('value', old);
    }
  }

  private _sourceMode: boolean | undefined;
  private _defaultSourceMode = false;
  private _sourceModeInitialized = false;

  @property({ type: Boolean, attribute: 'default-source-mode' })
  get defaultSourceMode(): boolean { return this._defaultSourceMode; }
  set defaultSourceMode(v: boolean) {
    const old = this._defaultSourceMode;
    this._defaultSourceMode = v;
    if (!this._sourceModeInitialized && this._sourceMode === undefined) {
      this.requestUpdate('defaultSourceMode', old);
    }
  }

  @property({ type: Boolean, reflect: true, attribute: 'source-mode' })
  get sourceMode(): boolean { return this._sourceMode ?? this._defaultSourceMode; }
  set sourceMode(v: boolean) {
    const old = this._sourceMode;
    this._sourceMode = v;
    this._sourceModeInitialized = true;
    this.requestUpdate('sourceMode', old);
    if (old !== v) this._dispatchModeChange(v ? 'source' : 'rich');
  }

  /** Show the formatting toolbar. */
  @property({ type: Boolean, reflect: true }) toolbar = true;

  /** Make the editor read-only. */
  @property({ type: Boolean, reflect: true, attribute: 'read-only' }) readOnly = false;

  @query('#rich-view')
  protected _$richView!: HTMLDivElement;

  @query('#source-editor')
  protected _$sourceEditor!: RCTextarea;

  @query('rc-editor-toolbar')
  protected _$toolbar?: HTMLElement;

  protected _observer: MutationObserver | null = null;
  protected _$savedRange: Range | null = null;
  protected _activeFormats: ActiveFormats = {};
  protected _syncTimer: ReturnType<typeof setTimeout> | null = null;
  protected _pluginApi: RCTextareaPluginAPI | null = null;
  protected _ignoreRichMutations = false;
  protected _richViewRendered = false;
  protected _cachedTree: ReturnType<typeof fromMarkdown> | null = null;

  // Lit calls updated() before firstUpdated() on the first cycle — guard
  // against mode switches before the initial content setup is done.
  protected _firstUpdatedDone = false;

  @query('.link-popover')
  protected _$linkPopover?: HTMLDivElement;

  @query('.link-popover-input')
  protected _$linkPopoverInput?: HTMLInputElement;

  @state()
  protected _linkPopoverOpen = false;

  @state()
  protected _linkPopoverHref = '';

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('selectionchange', this._onSelectionChange);
    document.addEventListener('click', this._onDocumentClick);
    this.addEventListener('keydown', this._onKeyDown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('selectionchange', this._onSelectionChange);
    document.removeEventListener('click', this._onDocumentClick);
    this.removeEventListener('keydown', this._onKeyDown);
    this._$richView?.removeEventListener('click', this._onRichViewClick);
    this._observer?.disconnect();
    if (this._syncTimer !== null) clearTimeout(this._syncTimer);
  }

  override firstUpdated() {
    // Read initial value from the slotted textarea BEFORE syncing it back.
    // Without this, _syncNativeTextarea() overwrites the authored content
    // with an empty string (the unset defaultValue).
    if (!this._valueInitialized) {
      const $textarea = this.querySelector<HTMLTextAreaElement>('textarea');
      if ($textarea?.value) this._defaultValue = $textarea.value;
    }

    this._observer = new MutationObserver(() => {
      if (!this._ignoreRichMutations) this._scheduleMarkdownSync();
    });
    this._observer.observe(this._$richView, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    this._$richView.addEventListener('click', this._onRichViewClick);
    this._setupSourcePlugin();

    // firstUpdated() handles the initial mode directly so updated() does not
    // switch modes on the first cycle.
    if (this.sourceMode) {
      this._$sourceEditor.value = this.value;
    } else {
      this._setRichViewContent(this.value);
    }

    this._syncNativeTextarea();
    this._connectLabel();
    this._firstUpdatedDone = true;
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has('sourceMode') || changed.has('defaultSourceMode')) {
      if (this._firstUpdatedDone) {
        if (this.sourceMode) this._switchToSource();
        else this._switchToRich();
      }
      // Keep source-button aria-pressed in sync for programmatic mode changes.
      this._pushToolbarState();
    }

    if (changed.has('value') && !this.sourceMode && this._richViewRendered) {
      this._setRichViewContent(this.value);
    }

    if (changed.has('_linkPopoverOpen') && this._linkPopoverOpen) {
      this._positionLinkPopover();
      this._$linkPopoverInput?.focus();
      this._$linkPopoverInput?.select();
    }
  }

  override render() {
    return html`
      <slot></slot>

      ${this.toolbar
        ? html`<rc-editor-toolbar
              part="toolbar"
              @rc-toolbar-action=${this._onToolbarAction}
            ></rc-editor-toolbar>`
        : nothing}

      <div
        id="rich-view"
        part="rich-view"
        contenteditable=${this.readOnly ? 'false' : 'true'}
        role="textbox"
        aria-multiline="true"
        spellcheck="true"
        ?hidden=${this.sourceMode}
      ></div>

      <div id="source-wrapper" ?hidden=${!this.sourceMode}>
        <rc-textarea
          id="source-editor"
          word-wrap
          @rc-change=${this._onSourceChange}
        ></rc-textarea>
      </div>

      ${this._linkPopoverOpen ? html`
        <div class="link-popover" role="dialog" aria-label="Link">
          <input
            type="url"
            class="link-popover-input"
            .value=${this._linkPopoverHref}
            placeholder="https://"
            aria-label="URL"
            @input=${(e: Event) => { this._linkPopoverHref = (e.target as HTMLInputElement).value; }}
            @keydown=${this._onLinkPopoverKeyDown}
          />
          <button type="button" class="link-popover-btn" title="Apply (Enter)" @click=${this._applyLink}>↵</button>
          <button type="button" class="link-popover-btn" title="Open link" ?disabled=${!this._linkPopoverHref} @click=${this._openLinkHref}>↗</button>
          <button type="button" class="link-popover-btn" title="Remove link" @click=${this._removeLink}>✕</button>
        </div>
      ` : nothing}
    `;
  }

  protected _setRichViewContent(markdown: string) {
    if (!this._$richView) return;
    this._ignoreRichMutations = true;
    this._$richView.innerHTML = this._renderMarkdown(markdown);
    this._ignoreRichMutations = false;
    this._richViewRendered = true;
  }

  protected _renderMarkdown(markdown: string): string {
    const markup = micromark(markdown, MICROMARK_OPTIONS);
    const tree = fromMarkdown(markdown, MDAST_OPTIONS);
    const langs: (string | null)[] = [];

    visit(tree, 'code', (node: { lang?: string | null }) => {
      langs.push(node.lang ?? null);
    });

    if (langs.length === 0) return markup;

    const doc = new DOMParser().parseFromString(markup, 'text/html');
    const $pres = doc.querySelectorAll('pre');

    langs.forEach((lang, i) => {
      if ($pres[i] && lang) $pres[i].dataset['lang'] = lang;
    });

    return doc.body.innerHTML;
  }

  protected _scheduleMarkdownSync() {
    if (this.sourceMode) return;
    if (this._syncTimer !== null) clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => {
      this._syncMarkdownFromRichView();
      this._syncTimer = null;
    }, 150);
  }

  protected _syncMarkdownFromRichView() {
    if (!this._$richView || this.sourceMode) return;
    const md = _turndown.turndown(this._$richView.innerHTML);
    if (md === this.value) return;
    this._value = md;
    this._syncNativeTextarea();
    this._dispatchChange(md);
  }

  protected _switchToSource() {
    if (!this._$richView || !this._$sourceEditor) return;
    // Flush any pending rich-view sync. _syncMarkdownFromRichView() guards on
    // `this.sourceMode`, which is already `true` by the time updated() calls
    // this method, so it would bail immediately — inline the flush instead.
    if (this._syncTimer !== null) {
      clearTimeout(this._syncTimer);
      this._syncTimer = null;
      const md = _turndown.turndown(this._$richView.innerHTML);
      if (md !== this.value) {
        this._value = md;
        this._syncNativeTextarea();
        this._dispatchChange(md);
      }
    }
    this._$sourceEditor.value = this.value;
    // Reset undo history so the first Ctrl+Z undoes to the pre-edit state
    // rather than to the end of a previous source-mode session.
    this._$sourceEditor.clearHistory();
  }

  protected _switchToRich() {
    if (!this._$richView) return;
    const md = this._$sourceEditor?.value ?? this.value;
    this._value = md;
    this._setRichViewContent(md);
    this._syncNativeTextarea();
  }

  protected _setupSourcePlugin() {
    this._$sourceEditor.usePlugin({
      mount: (api: RCTextareaPluginAPI) => {
        this._pluginApi = api;
        api.adoptStyleSheet(_sourceHighlightSheet);
        api.onCursorMove((start: number, end: number) => {
          if (!this.sourceMode) return;

          const formats = getFormatsFromDecorations(api.getDecorations(), start, end);
          const lang = formats.codeBlock && this._cachedTree
            ? this._getCodeBlockLanguage(this._cachedTree, start)
            : null;

          this._activeFormats = { ...formats, codeLanguage: lang };
          this._pushToolbarState();
        });
      },
      destroy: () => {
        this._pluginApi = null;
        this._cachedTree = null;
      },
      update: (value: string, api: RCTextareaPluginAPI) => {
        const tree = fromMarkdown(value, MDAST_OPTIONS);
        const decorations: DecorationInput[] = [];

        this._cachedTree = tree;

        visit(
          tree,
          (node: {
            type: string;
            depth?: number;
            ordered?: boolean | null;
            position?: { start: { offset?: number }; end: { offset?: number } };
          }) => {
            const from = node.position?.start.offset;
            const to = node.position?.end.offset;
            if (from === undefined || to === undefined) return;

            if (node.type === 'list') {
              decorations.push({
                type: 'mark', from, to,
                className: node.ordered ? 'rme-list-ordered' : 'rme-list-bullet',
              } as DecorationInput);

              return;
            }

            const style = DECORATION_MAP[node.type];
            if (!style) return;

            const dec: DecorationInput = { type: 'mark', from, to, ...style };
            if (node.type === 'heading' && node.depth) {
              dec.className = `rme-heading-h${node.depth}`;
            }
            decorations.push(dec);
          },
        );

        api.setDecorations(decorations);
      },
    });
  }

  protected _getCodeBlockLanguage(
    tree: ReturnType<typeof fromMarkdown>,
    offset: number,
  ): string | null {
    let lang: string | null = null;
    visit(
      tree,
      'code',
      (node: { lang?: string | null; position?: { start: { offset?: number }; end: { offset?: number } } }) => {
        const from = node.position?.start.offset;
        const to = node.position?.end.offset;
        if (from !== undefined && to !== undefined && from <= offset && to >= offset) {
          lang = node.lang ?? '';
        }
      },
    );

    return lang;
  }

  protected _onSourceChange = (_e: Event) => {
    const md = this._$sourceEditor?.value ?? '';
    if (md === this.value) return;
    this._value = md;
    this._syncNativeTextarea();
    this._dispatchChange(md);
  };

  protected _onToolbarAction = (e: CustomEvent<EditorToolbarActionDetail>) => {
    const { action, headingLevel, codeLanguage } = e.detail;

    if (action === 'source') {
      this.sourceMode = !this.sourceMode;
      return;
    }

    if (action === 'code-block-language') {
      if (this.sourceMode) this._setSourceCodeBlockLanguage(codeLanguage ?? '');
      else this._setRichCodeBlockLanguage(codeLanguage ?? '');
      return;
    }

    if (action === 'heading' && headingLevel !== undefined) {
      if (this.sourceMode) this._setSourceHeadingLevel(headingLevel);
      else document.execCommand('formatBlock', false, headingLevel ?? 'p');
      return;
    }

    if (this.sourceMode) {
      this._applySourceFormat(action);
    } else {
      this._applyRichFormat(action);
    }
  };

  protected _applyRichFormat(action: EditorToolbarAction) {
    if (this.readOnly || !this._$richView) return;

    // Restore saved selection before applying command (toolbar click stole focus)
    this._$richView.focus();
    if (this._$savedRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(this._$savedRange.cloneRange());
      }
    }

    // For character-scope actions, expand a collapsed cursor to the word at cursor
    const CHAR_SCOPE = new Set<EditorToolbarAction>(['bold', 'italic', 'underline', 'strikethrough', 'code', 'link']);
    if (CHAR_SCOPE.has(action)) {
      this._expandRichSelectionToWord();
      const sel = window.getSelection();
      if (sel?.rangeCount) this._$savedRange = sel.getRangeAt(0).cloneRange();
    }

    switch (action) {
      case 'bold':          document.execCommand('bold');             break;
      case 'italic':        document.execCommand('italic');           break;
      case 'underline':     document.execCommand('underline');        break;
      case 'strikethrough': this._wrapRichSelection('s');             break;
      case 'code':          this._wrapRichSelection('code');          break;
      case 'blockquote': {
        const newTag = this._activeFormats.blockquote ? 'p' : 'blockquote';
        document.execCommand('formatBlock', false, newTag);
        break;
      }
      case 'bullet-list':   document.execCommand('insertUnorderedList'); break;
      case 'ordered-list':  document.execCommand('insertOrderedList');   break;
      case 'code-block':    this._toggleRichCodeBlock();                  break;
      case 'link': {
        const sel = window.getSelection();
        const anchor = sel?.rangeCount ? sel.getRangeAt(0).commonAncestorContainer : null;
        const $el = anchor
          ? (anchor.nodeType === Node.TEXT_NODE ? (anchor as Text).parentElement : anchor as Element)
          : null;
        this._linkPopoverHref = $el?.closest<HTMLAnchorElement>('a[href]')?.href ?? '';
        this._linkPopoverOpen = true;
        break;
      }
    }
  }

  protected _applySourceFormat(action: EditorToolbarAction) {
    const editor = this._$sourceEditor;
    const api = this._pluginApi;
    if (!editor) return;

    // For character-scope wraps with a collapsed cursor, expand to word at cursor
    const WORD_WRAP: Partial<Record<EditorToolbarAction, [string, string]>> = {
      bold: ['**', '**'], italic: ['*', '*'], strikethrough: ['~~', '~~'], code: ['`', '`'],
    };
    const wrap = WORD_WRAP[action];
    if (wrap && api && api.selectionStart === api.selectionEnd) {
      const wordInfo = api.getWordAtCursor();
      if (wordInfo) {
        const [pre, suf] = wrap;
        editor.value = api.value.slice(0, wordInfo.from) + pre + wordInfo.word + suf + api.value.slice(wordInfo.to);
        return;
      }
    }

    switch (action) {
      case 'bold':          editor.wrapSelection('**', '**');      break;
      case 'italic':        editor.wrapSelection('*', '*');        break;
      case 'underline':     editor.wrapSelection('<u>', '</u>');   break;
      case 'strikethrough': editor.wrapSelection('~~', '~~');      break;
      case 'code':          editor.wrapSelection('`', '`');        break;
      case 'link':          editor.replaceSelection('[](url)');    break;
      case 'blockquote':    this._toggleLinePrefix('> ');          break;
      case 'bullet-list':   this._toggleLinePrefix('- ');          break;
      case 'ordered-list':  this._toggleLinePrefix('1. ');         break;
      case 'code-block':    this._toggleSourceCodeFence();         break;
    }
  }

  /** Sets the heading level on the cursor's line in source mode. null = paragraph. */
  protected _setSourceHeadingLevel(level: HeadingLevel | null) {
    const api = this._pluginApi;
    const editor = this._$sourceEditor;
    if (!api || !editor) return;

    const { value, selectionStart } = api;
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;

    const stripped = value.slice(lineStart).replace(/^#{1,6} /, '');
    const prefix = level ? '#'.repeat(parseInt(level[1]!)) + ' ' : '';
    editor.value = value.slice(0, lineStart) + prefix + stripped + value.slice(
      lineStart + (value.slice(lineStart).length - stripped.length),
    );
  }

  /** Updates the language of the code block at the cursor in source mode. */
  protected _setSourceCodeBlockLanguage(lang: string) {
    const api = this._pluginApi;
    const editor = this._$sourceEditor;
    if (!api || !editor) return;

    const nextValue = setCodeBlockLanguage(api.value, api.selectionStart, lang);
    if (nextValue === null) return;

    editor.value = nextValue;
  }

  /** Updates the `data-lang` attribute on the `<pre>` at the cursor in rich mode. */
  protected _setRichCodeBlockLanguage(lang: string) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const anchor = sel.getRangeAt(0).commonAncestorContainer;
    const $el: Element | null =
      anchor.nodeType === Node.TEXT_NODE
        ? (anchor as Text).parentElement
        : (anchor as Element);

    const $pre = $el?.closest('pre');
    if (!$pre) return;
    if (lang) $pre.dataset['lang'] = lang;
    else delete $pre.dataset['lang'];
  }

  /** Toggles a line prefix (e.g. `'> '`, `'- '`) on the cursor's line. */
  protected _toggleLinePrefix(prefix: string) {
    const api = this._pluginApi;
    const editor = this._$sourceEditor;
    if (!api || !editor) return;

    const { value, selectionStart } = api;
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;

    if (value.startsWith(prefix, lineStart)) {
      editor.value = value.slice(0, lineStart) + value.slice(lineStart + prefix.length);
    } else {
      editor.value = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    }
  }

  /** Wraps the current selection (or cursor line) with a fenced code block. */
  protected _toggleSourceCodeFence() {
    const api = this._pluginApi;
    const editor = this._$sourceEditor;
    if (!api || !editor) return;

    const { value, selectionStart, selectionEnd } = api;
    const fence = '```';

    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineEndIdx = value.indexOf('\n', selectionEnd);
    const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;

    const prevNewline = value.lastIndexOf('\n', lineStart - 2);
    const prevLine = prevNewline === -1 ? '' : value.slice(prevNewline + 1, lineStart - 1);
    const afterEnd = lineEnd + 1;
    const nextNewline = value.indexOf('\n', afterEnd);
    const nextLine = value.slice(afterEnd, nextNewline === -1 ? undefined : nextNewline);

    if (prevLine.trim() === fence && nextLine.trim() === fence) {
      const unwrapStart = prevNewline === -1 ? 0 : prevNewline + 1;
      const unwrapEnd = nextNewline === -1 ? value.length : nextNewline + 1;
      const inner = value.slice(lineStart, lineEnd);
      editor.value = value.slice(0, unwrapStart) + inner + '\n' + value.slice(unwrapEnd);

      return;
    }

    const selected = value.slice(lineStart, lineEnd);
    editor.value =
      value.slice(0, lineStart) +
      fence + '\n' + selected + '\n' + fence +
      value.slice(lineEnd);
  }

  protected _wrapRichSelection(tag: string) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;

    const $el = document.createElement(tag);
    try {
      range.surroundContents($el);
    } catch {
      // surroundContents fails when the range partially overlaps existing elements
      const fragment = range.extractContents();
      $el.appendChild(fragment);
      range.insertNode($el);
    }
    sel.removeAllRanges();
    sel.addRange(range);
  }

  protected _toggleRichCodeBlock() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const anchor = range.commonAncestorContainer;
    const $el: Element | null =
      anchor.nodeType === Node.TEXT_NODE
        ? (anchor as Text).parentElement
        : (anchor as Element);

    const $existingPre = $el?.closest('pre');
    if ($existingPre) {
      const $p = document.createElement('p');
      $p.textContent = $existingPre.textContent ?? '';
      $existingPre.replaceWith($p);
      const unwrapRange = document.createRange();
      unwrapRange.selectNodeContents($p);
      unwrapRange.collapse(false);
      sel.removeAllRanges();
      sel.addRange(unwrapRange);

      return;
    }

    const $pre = document.createElement('pre');
    const $code = document.createElement('code');
    $pre.appendChild($code);

    try {
      const fragment = range.extractContents();
      $code.appendChild(fragment);
      range.insertNode($pre);
    } catch {
      if ($el && $el !== this._$richView) {
        $code.textContent = $el.textContent ?? '';
        $el.replaceWith($pre);
      }
    }

    // insertNode leaves the selection spanning <pre>; collapse cursor into <code>
    // so the next keystroke types inside the block rather than replacing it.
    const innerRange = document.createRange();
    innerRange.selectNodeContents($code);
    innerRange.collapse(false);
    sel.removeAllRanges();
    sel.addRange(innerRange);
  }

  protected _onKeyDown = (e: KeyboardEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;

    if (e.shiftKey && e.key === 'S') {
      e.preventDefault();
      this.sourceMode = !this.sourceMode;
      return;
    }

    if (e.shiftKey) return;

    let action: EditorToolbarAction | null = null;
    switch (e.key) {
      case 'b': action = 'bold';          break;
      case 'i': action = 'italic';        break;
      case 'u': action = 'underline';     break;
      case '`': action = 'code';          break;
      case 'k': action = 'link';          break;
    }

    if (action) {
      e.preventDefault();
      if (this.sourceMode) this._applySourceFormat(action);
      else this._applyRichFormat(action);
    }
  };

  protected _onSelectionChange = () => {
    // Chrome shadow-adjusts window.getSelection() to the nearest light-DOM ancestor
    // for selections inside a shadow root — use shadowRoot.getSelection() when available.
    const sel =
      (this.shadowRoot as unknown as { getSelection?: () => Selection | null })
        .getSelection?.() ?? window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const anchor = range.commonAncestorContainer;
    const $el: Element | null =
      anchor.nodeType === Node.TEXT_NODE
        ? (anchor as Text).parentElement
        : (anchor as Element);

    if (!this._$richView?.contains($el)) return;

    this._$savedRange = range.cloneRange();

    if (this.sourceMode) return;

    const $pre = $el?.closest('pre');
    this._activeFormats = {
      bold:          !!$el?.closest('strong, b'),
      italic:        !!$el?.closest('em, i'),
      underline:     !!$el?.closest('u'),
      strikethrough: !!$el?.closest('s, del, strike'),
      code:          !$pre && !!$el?.closest('code'),
      link:          !!$el?.closest('a'),
      heading:       ($el?.closest('h1,h2,h3,h4,h5,h6')?.tagName.toLowerCase() ?? null) as HeadingLevel | null,
      blockquote:    !!$el?.closest('blockquote'),
      bulletList:    !!$el?.closest('ul'),
      orderedList:   !!$el?.closest('ol'),
      codeBlock:     !!$pre,
      codeLanguage:  $pre ? ($pre.dataset['lang'] ?? '') : null,
    };

    this._pushToolbarState();
  };

  protected _pushToolbarState() {
    const $toolbar = this._$toolbar as (HTMLElement & {
      activeBold?: boolean;
      activeItalic?: boolean;
      activeUnderline?: boolean;
      activeStrikethrough?: boolean;
      activeCode?: boolean;
      activeLink?: boolean;
      activeHeading?: HeadingLevel | null;
      activeBlockquote?: boolean;
      activeBulletList?: boolean;
      activeOrderedList?: boolean;
      activeCodeBlock?: boolean;
      codeLanguage?: string | null;
      sourceMode?: boolean;
    }) | undefined;

    if ($toolbar) {
      $toolbar.activeBold          = !!this._activeFormats.bold;
      $toolbar.activeItalic        = !!this._activeFormats.italic;
      $toolbar.activeUnderline     = !!this._activeFormats.underline;
      $toolbar.activeStrikethrough = !!this._activeFormats.strikethrough;
      $toolbar.activeCode          = !!this._activeFormats.code;
      $toolbar.activeLink          = !!this._activeFormats.link;
      $toolbar.activeHeading       = this._activeFormats.heading ?? null;
      $toolbar.activeBlockquote    = !!this._activeFormats.blockquote;
      $toolbar.activeBulletList    = !!this._activeFormats.bulletList;
      $toolbar.activeOrderedList   = !!this._activeFormats.orderedList;
      $toolbar.activeCodeBlock     = !!this._activeFormats.codeBlock;
      $toolbar.codeLanguage        = this._activeFormats.codeLanguage ?? null;
      $toolbar.sourceMode          = this.sourceMode;
    }

    this.dispatchEvent(new CustomEvent<ActiveFormats>('rc-formatting-change', {
      bubbles: true,
      composed: true,
      detail: { ...this._activeFormats },
    }));
  }

  protected _syncNativeTextarea() {
    const $textarea = this.querySelector<HTMLTextAreaElement>('textarea');
    if ($textarea) $textarea.value = this.value;
  }

  protected _connectLabel() {
    const $textarea = this.querySelector<HTMLTextAreaElement>('textarea');
    if (!$textarea) return;

    // Mirror label text to the rich view for accessibility
    const $label = $textarea.id
      ? this.querySelector<HTMLLabelElement>(`label[for="${CSS.escape($textarea.id)}"]`)
      : null;

    if ($label && this._$richView) {
      this._$richView.setAttribute('aria-label', $label.textContent?.trim() ?? '');
    }

    // Forward label click to the active editor surface
    $label?.addEventListener('click', () => {
      if (!this.sourceMode) this._$richView?.focus();
    });
  }

  protected _onRichViewClick = (e: MouseEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    const $a = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
    if (!$a) return;
    e.preventDefault();
    window.open($a.href, '_blank', 'noopener,noreferrer');
  };

  protected _onDocumentClick = (e: MouseEvent) => {
    if (!this._linkPopoverOpen) return;
    const $popover = this.shadowRoot?.querySelector('.link-popover');
    if ($popover && e.composedPath().includes($popover)) return;
    this._linkPopoverOpen = false;
  };

  protected _expandRichSelectionToWord(): void {
    const sel = window.getSelection();
    if (!sel?.isCollapsed) return;
    const modify = (sel as unknown as { modify?: (alter: string, dir: string, unit: string) => void }).modify;
    if (typeof modify !== 'function') return;
    modify.call(sel, 'move', 'backward', 'word');
    modify.call(sel, 'extend', 'forward', 'word');
  }

  protected _positionLinkPopover(): void {
    if (!this._$savedRange || !this._$linkPopover) return;
    const rangeRect = this._$savedRange.getBoundingClientRect();
    const hostRect = this.getBoundingClientRect();
    this._$linkPopover.style.top  = `${rangeRect.bottom - hostRect.top + 4}px`;
    this._$linkPopover.style.left = `${Math.max(0, rangeRect.left - hostRect.left)}px`;
  }

  protected _applyLink = () => {
    this._linkPopoverOpen = false;
    if (!this._linkPopoverHref) return;
    this._$richView?.focus();
    if (this._$savedRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(this._$savedRange.cloneRange());
      }
    }
    document.execCommand('createLink', false, this._linkPopoverHref);
  };

  protected _removeLink = () => {
    this._linkPopoverOpen = false;
    this._$richView?.focus();
    if (this._$savedRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(this._$savedRange.cloneRange());
      }
    }
    document.execCommand('unlink');
  };

  protected _openLinkHref = () => {
    if (this._linkPopoverHref) window.open(this._linkPopoverHref, '_blank', 'noopener,noreferrer');
  };

  protected _onLinkPopoverKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._applyLink();
    } else if (e.key === 'Escape') {
      this._linkPopoverOpen = false;
      this._$richView?.focus();
    }
  };

  protected _dispatchChange(value: string) {
    this.dispatchEvent(new CustomEvent<{ value: string }>('rc-change', {
      bubbles: true,
      composed: true,
      detail: { value },
    }));
  }

  protected _dispatchModeChange(mode: EditorMode) {
    this.dispatchEvent(new CustomEvent<{ mode: EditorMode }>('rc-mode-change', {
      bubbles: true,
      composed: true,
      detail: { mode },
    }));
  }
}
