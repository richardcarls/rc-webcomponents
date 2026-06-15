import { LitElement, html, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
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


// ── Markdown rendering options ────────────────────────────────────────────────

const MICROMARK_OPTIONS = {
  allowDangerousHtml: true,          // preserves <u> underline passthrough
  extensions: [gfmStrikethrough()],  // renders ~~text~~ as <del>
};

const MDAST_OPTIONS = {
  extensions: [gfmStrikethrough()],
  mdastExtensions: [gfmStrikethroughFromMarkdown()],
};


// ── Turndown instance (module-level singleton) ────────────────────────────────

const _turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  fence: '```',
  emDelimiter: '*',
  strongDelimiter: '**',
});

// Inline code: <code> outside <pre> → `backticks`
_turndown.addRule('inlineCode', {
  filter: (node) => node.nodeName === 'CODE' && node.parentElement?.nodeName !== 'PRE',
  replacement: (content) => '`' + content + '`',
});

// Underline: preserve <u> as HTML (no markdown equivalent)
_turndown.addRule('underline', {
  filter: ['u'],
  replacement: (content) => '<u>' + content + '</u>',
});

// Strikethrough: <s>/<del>/<strike> → ~~text~~
_turndown.addRule('strikethrough', {
  filter: (node) => ['S', 'DEL', 'STRIKE'].includes(node.nodeName),
  replacement: (content) => '~~' + content + '~~',
});

// Code blocks with language: read data-lang from <pre>, emit fenced block
_turndown.addRule('codeBlockWithLang', {
  filter: (node) => node.nodeName === 'PRE' && !!node.querySelector('code'),
  replacement: (_content, node) => {
    const pre = node as HTMLElement;
    const code = pre.querySelector('code');
    const lang = pre.dataset['lang'] ?? '';
    return '\n\n```' + lang + '\n' + (code?.textContent ?? '') + '\n```\n\n';
  },
});


// ── Decoration style map for markdown AST nodes ───────────────────────────────

type PartialDecoration = Partial<Omit<DecorationInput, 'type' | 'from' | 'to'>>;

const DECORATION_MAP: Record<string, PartialDecoration> = {
  heading:       { bold: true },         // className set per depth below
  emphasis:      { italic: true },
  strong:        { bold: true },
  inlineCode:    { className: 'rme-code' },
  link:          { underline: 'solid', className: 'rme-link' },
  blockquote:    { className: 'rme-blockquote' },
  code:          { className: 'rme-code-block' }, // fenced code block
  delete:        { className: 'rme-strikethrough' }, // GFM ~~text~~
  // list and html (underline) are handled dynamically below
};


// ── RcMarkdownEditor ──────────────────────────────────────────────────────────

/**
 * Markdown-backed rich-text editor with two first-class modes:
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

  // ── Value (controlled / uncontrolled) ────────────────────────────────────

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

  // ── Source mode (controlled / uncontrolled) ───────────────────────────────

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

  // ── Other properties ──────────────────────────────────────────────────────

  /** Show the formatting toolbar. */
  @property({ type: Boolean, reflect: true }) toolbar = true;

  /** Make the editor read-only. */
  @property({ type: Boolean, reflect: true, attribute: 'read-only' }) readOnly = false;

  // ── Internal refs (via @query) ────────────────────────────────────────────

  @query('#rich-view')      private _richView!: HTMLDivElement;
  @query('#source-editor')  private _sourceEditor!: RCTextarea;
  @query('rc-editor-toolbar') private _toolbarEl?: HTMLElement;

  // ── Internal state ────────────────────────────────────────────────────────

  private _observer: MutationObserver | null = null;
  private _savedRichRange: Range | null = null;
  private _activeFormats: ActiveFormats = {};
  private _syncTimer: ReturnType<typeof setTimeout> | null = null;
  private _pluginApi: RCTextareaPluginAPI | null = null;
  private _ignoreRichMutations = false;
  private _richViewRendered = false;

  // On the first updated() call after firstUpdated(), the changed map will
  // include 'sourceMode' if it was set as an attribute. We skip that one call
  // because firstUpdated() already initialized the correct mode.
  private _skipNextModeSwitch = false;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  override connectedCallback() {
    super.connectedCallback();
    document.addEventListener('selectionchange', this._onSelectionChange);
    this.addEventListener('keydown', this._onKeyDown);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('selectionchange', this._onSelectionChange);
    this.removeEventListener('keydown', this._onKeyDown);
    this._observer?.disconnect();
    if (this._syncTimer !== null) clearTimeout(this._syncTimer);
  }

  override firstUpdated() {
    // Read the initial value from the slotted textarea BEFORE syncing it back.
    // Without this, _syncNativeTextarea() would overwrite the textarea's authored
    // content with an empty string (the unset defaultValue).
    if (!this._valueInitialized) {
      const textarea = this.querySelector<HTMLTextAreaElement>('textarea');
      if (textarea?.value) this._defaultValue = textarea.value;
    }

    // Set up MutationObserver on the rich view
    this._observer = new MutationObserver(() => {
      if (!this._ignoreRichMutations) this._scheduleMarkdownSync();
    });
    this._observer.observe(this._richView, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Set up markdown plugin on the source editor
    this._setupSourcePlugin();

    // Initial mode setup
    if (this.sourceMode) {
      this._sourceEditor.value = this.value;
      this._skipNextModeSwitch = true;
    } else {
      this._setRichViewContent(this.value);
      this._skipNextModeSwitch = true;
    }

    // Sync native backing textarea (value is now correct)
    this._syncNativeTextarea();

    // Wire label → rich-view focus
    this._connectLabel();
  }

  override updated(changed: Map<string, unknown>) {
    if (changed.has('sourceMode') || changed.has('defaultSourceMode')) {
      if (this._skipNextModeSwitch) {
        this._skipNextModeSwitch = false;
      } else {
        if (this.sourceMode) this._switchToSource();
        else this._switchToRich();
      }
      // Keep source-button aria-pressed in sync whenever mode changes,
      // including programmatic changes not initiated by the toolbar.
      this._pushToolbarState();
    }

    // Programmatic value change while in rich mode: re-render the rich view
    if (changed.has('value') && !this.sourceMode && this._richViewRendered) {
      this._setRichViewContent(this.value);
    }
  }

  // ── Rendering ─────────────────────────────────────────────────────────────

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
    `;
  }

  // ── Rich view ─────────────────────────────────────────────────────────────

  private _setRichViewContent(markdown: string) {
    if (!this._richView) return;
    this._ignoreRichMutations = true;
    this._richView.innerHTML = this._renderMarkdown(markdown);
    this._ignoreRichMutations = false;
    this._richViewRendered = true;
  }

  private _renderMarkdown(markdown: string): string {
    const html = micromark(markdown, MICROMARK_OPTIONS);

    // Annotate <pre> elements with data-lang from the markdown AST
    const tree = fromMarkdown(markdown, MDAST_OPTIONS);
    const langs: (string | null)[] = [];

    visit(tree, 'code', (node: { lang?: string | null }) => {
      langs.push(node.lang ?? null);
    });

    if (langs.length === 0) return html;

    const doc = new DOMParser().parseFromString(html, 'text/html');
    const pres = doc.querySelectorAll('pre');

    langs.forEach((lang, i) => {
      if (pres[i] && lang) pres[i].dataset['lang'] = lang;
    });

    return doc.body.innerHTML;
  }

  private _scheduleMarkdownSync() {
    if (this.sourceMode) return;
    if (this._syncTimer !== null) clearTimeout(this._syncTimer);
    this._syncTimer = setTimeout(() => {
      this._syncMarkdownFromRichView();
      this._syncTimer = null;
    }, 150);
  }

  private _syncMarkdownFromRichView() {
    if (!this._richView || this.sourceMode) return;
    const md = _turndown.turndown(this._richView.innerHTML);
    if (md === this.value) return;
    this._value = md;
    this._syncNativeTextarea();
    this._dispatchChange(md);
  }

  // ── Mode switching ────────────────────────────────────────────────────────

  private _switchToSource() {
    if (!this._richView || !this._sourceEditor) return;
    // Flush any pending sync first
    if (this._syncTimer !== null) {
      clearTimeout(this._syncTimer);
      this._syncTimer = null;
      this._syncMarkdownFromRichView();
    }
    this._sourceEditor.value = this.value;
    // Reset undo history so the first Ctrl+Z in this session undoes to the
    // pre-edit state rather than to the end of a previous source-mode session.
    this._sourceEditor.clearHistory();
  }

  private _switchToRich() {
    if (!this._richView) return;
    const md = this._sourceEditor?.value ?? this.value;
    this._value = md;
    this._setRichViewContent(md);
    this._syncNativeTextarea();
  }

  // ── Source editor ─────────────────────────────────────────────────────────

  private _cachedTree: ReturnType<typeof fromMarkdown> | null = null;

  private _setupSourcePlugin() {
    this._sourceEditor.usePlugin({
      mount: (api: RCTextareaPluginAPI) => {
        this._pluginApi = api;
        api.onCursorMove((start: number, end: number) => {
          if (!this.sourceMode) return;
          const formats = getFormatsFromDecorations(api.getDecorations(), start, end);
          // Resolve code block language from the cached MDAST
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
        this._cachedTree = tree;
        const decorations: DecorationInput[] = [];

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

  private _getCodeBlockLanguage(
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

  private _onSourceChange = (e: Event) => {
    void e;
    const md = this._sourceEditor?.value ?? '';
    if (md === this.value) return;
    this._value = md;
    this._syncNativeTextarea();
    this._dispatchChange(md);
  };

  // ── Toolbar ───────────────────────────────────────────────────────────────

  private _onToolbarAction = (e: CustomEvent<EditorToolbarActionDetail>) => {
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

  private _applyRichFormat(action: EditorToolbarAction) {
    if (this.readOnly || !this._richView) return;

    // Restore saved selection before applying command (toolbar click stole focus)
    this._richView.focus();
    if (this._savedRichRange) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(this._savedRichRange.cloneRange());
      }
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
        // TODO: replace prompt with a proper link popover
        const url = prompt('Enter URL:');
        if (url) document.execCommand('createLink', false, url);
        break;
      }
    }
  }

  private _applySourceFormat(action: EditorToolbarAction) {
    const editor = this._sourceEditor;
    if (!editor) return;

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
  private _setSourceHeadingLevel(level: HeadingLevel | null) {
    const api = this._pluginApi;
    const editor = this._sourceEditor;
    if (!api || !editor) return;

    const { value, selectionStart } = api;
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;

    // Strip any existing heading prefix
    const stripped = value.slice(lineStart).replace(/^#{1,6} /, '');
    const prefix = level ? '#'.repeat(parseInt(level[1]!)) + ' ' : '';
    editor.value = value.slice(0, lineStart) + prefix + stripped + value.slice(
      lineStart + (value.slice(lineStart).length - stripped.length),
    );
  }

  /** Updates the language of the code block at the cursor in source mode. */
  private _setSourceCodeBlockLanguage(lang: string) {
    const api = this._pluginApi;
    const editor = this._sourceEditor;
    if (!api || !editor) return;

    const nextValue = setCodeBlockLanguage(api.value, api.selectionStart, lang);

    if (nextValue === null) return;

    editor.value = nextValue;
  }

  /** Updates the data-lang attribute on the <pre> at the cursor in rich mode. */
  private _setRichCodeBlockLanguage(lang: string) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const anchor = sel.getRangeAt(0).commonAncestorContainer;
    const el: Element | null =
      anchor.nodeType === Node.TEXT_NODE
        ? (anchor as Text).parentElement
        : (anchor as Element);

    const pre = el?.closest('pre');
    if (!pre) return;
    if (lang) pre.dataset['lang'] = lang;
    else delete pre.dataset['lang'];
  }

  /** Toggles a line prefix (e.g. `'# '`, `'> '`, `'- '`) on the cursor's line. */
  private _toggleLinePrefix(prefix: string) {
    const api = this._pluginApi;
    const editor = this._sourceEditor;
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
  private _toggleSourceCodeFence() {
    const api = this._pluginApi;
    const editor = this._sourceEditor;
    if (!api || !editor) return;

    const { value, selectionStart, selectionEnd } = api;
    const fence = '```';

    // Determine line boundaries for the selection
    const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
    const lineEndIdx = value.indexOf('\n', selectionEnd);
    const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;

    // Check if the block is already wrapped (previous non-empty line is ``` and next is ```)
    const prevNewline = value.lastIndexOf('\n', lineStart - 2);
    const prevLine = prevNewline === -1 ? '' : value.slice(prevNewline + 1, lineStart - 1);
    const afterEnd = lineEnd + 1;
    const nextNewline = value.indexOf('\n', afterEnd);
    const nextLine = value.slice(afterEnd, nextNewline === -1 ? undefined : nextNewline);

    if (prevLine.trim() === fence && nextLine.trim() === fence) {
      // Unwrap: remove the fence lines
      const unwrapStart = prevNewline === -1 ? 0 : prevNewline + 1;
      const unwrapEnd = nextNewline === -1 ? value.length : nextNewline + 1;
      const inner = value.slice(lineStart, lineEnd);
      editor.value = value.slice(0, unwrapStart) + inner + '\n' + value.slice(unwrapEnd);
      return;
    }

    // Wrap the selected lines
    const selected = value.slice(lineStart, lineEnd);
    editor.value =
      value.slice(0, lineStart) +
      fence + '\n' + selected + '\n' + fence +
      value.slice(lineEnd);
  }

  private _wrapRichSelection(tag: string) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;

    const el = document.createElement(tag);
    try {
      range.surroundContents(el);
    } catch {
      // surroundContents fails when range partially overlaps existing elements
      const fragment = range.extractContents();
      el.appendChild(fragment);
      range.insertNode(el);
    }
    sel.removeAllRanges();
    sel.addRange(range);
  }

  private _toggleRichCodeBlock() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const anchor = range.commonAncestorContainer;
    const el: Element | null =
      anchor.nodeType === Node.TEXT_NODE
        ? (anchor as Text).parentElement
        : (anchor as Element);

    const existingPre = el?.closest('pre');
    if (existingPre) {
      // Unwrap: replace <pre> with a <p> containing the plain text
      const p = document.createElement('p');
      p.textContent = existingPre.textContent ?? '';
      existingPre.replaceWith(p);
      return;
    }

    // Wrap: create <pre><code> around the selection (or current block)
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    pre.appendChild(code);

    try {
      const fragment = range.extractContents();
      code.appendChild(fragment);
      range.insertNode(pre);
    } catch {
      // Fallback: wrap the current element
      if (el && el !== this._richView) {
        code.textContent = el.textContent ?? '';
        el.replaceWith(pre);
      }
    }
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  private _onKeyDown = (e: KeyboardEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;

    // Ctrl+Shift+S — toggle source mode
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

  // ── Selection tracking ────────────────────────────────────────────────────

  private _onSelectionChange = () => {
    // Chrome shadow-adjusts window.getSelection() to the nearest light-DOM ancestor
    // for selections inside a shadow root — use shadowRoot.getSelection() when available.
    const sel =
      (this.shadowRoot as unknown as { getSelection?: () => Selection | null })
        .getSelection?.() ?? window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const range = sel.getRangeAt(0);
    const anchor = range.commonAncestorContainer;
    const el: Element | null =
      anchor.nodeType === Node.TEXT_NODE
        ? (anchor as Text).parentElement
        : (anchor as Element);

    if (!this._richView?.contains(el)) return;

    // Save the range for restoring before execCommand
    this._savedRichRange = range.cloneRange();

    if (this.sourceMode) return;

    const pre = el?.closest('pre');
    this._activeFormats = {
      bold:          !!el?.closest('strong, b'),
      italic:        !!el?.closest('em, i'),
      underline:     !!el?.closest('u'),
      strikethrough: !!el?.closest('s, del, strike'),
      code:          !pre && !!el?.closest('code'),
      link:          !!el?.closest('a'),
      heading:       (el?.closest('h1,h2,h3,h4,h5,h6')?.tagName.toLowerCase() ?? null) as HeadingLevel | null,
      blockquote:    !!el?.closest('blockquote'),
      bulletList:    !!el?.closest('ul'),
      orderedList:   !!el?.closest('ol'),
      codeBlock:     !!pre,
      codeLanguage:  pre ? (pre.dataset['lang'] ?? '') : null,
    };

    this._pushToolbarState();
  };

  // ── Toolbar state sync ────────────────────────────────────────────────────

  private _pushToolbarState() {
    const toolbar = this._toolbarEl as (HTMLElement & {
      activeBold?: boolean;
      activeItalic?: boolean;
      activeUnderline?: boolean;
      activeStrikethrough?: boolean;
      activeCode?: boolean;
      activeHeading?: HeadingLevel | null;
      activeBlockquote?: boolean;
      activeBulletList?: boolean;
      activeOrderedList?: boolean;
      activeCodeBlock?: boolean;
      codeLanguage?: string | null;
      sourceMode?: boolean;
    }) | undefined;

    if (toolbar) {
      toolbar.activeBold          = !!this._activeFormats.bold;
      toolbar.activeItalic        = !!this._activeFormats.italic;
      toolbar.activeUnderline     = !!this._activeFormats.underline;
      toolbar.activeStrikethrough = !!this._activeFormats.strikethrough;
      toolbar.activeCode          = !!this._activeFormats.code;
      toolbar.activeHeading       = this._activeFormats.heading ?? null;
      toolbar.activeBlockquote    = !!this._activeFormats.blockquote;
      toolbar.activeBulletList    = !!this._activeFormats.bulletList;
      toolbar.activeOrderedList   = !!this._activeFormats.orderedList;
      toolbar.activeCodeBlock     = !!this._activeFormats.codeBlock;
      toolbar.codeLanguage        = this._activeFormats.codeLanguage ?? null;
      toolbar.sourceMode          = this.sourceMode;
    }

    this.dispatchEvent(new CustomEvent<ActiveFormats>('rc-formatting-change', {
      bubbles: true,
      composed: true,
      detail: { ...this._activeFormats },
    }));
  }

  // ── Form integration ──────────────────────────────────────────────────────

  private _syncNativeTextarea() {
    const textarea = this.querySelector<HTMLTextAreaElement>('textarea');
    if (textarea) textarea.value = this.value;
  }

  private _connectLabel() {
    const textarea = this.querySelector<HTMLTextAreaElement>('textarea');
    if (!textarea) return;

    // Mirror label text to the rich view for accessibility
    const label = textarea.id
      ? this.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(textarea.id)}"]`)
      : null;

    if (label && this._richView) {
      this._richView.setAttribute('aria-label', label.textContent?.trim() ?? '');
    }

    // Forward label click to the active editor surface
    label?.addEventListener('click', () => {
      if (!this.sourceMode) this._richView?.focus();
    });
  }

  // ── Events ────────────────────────────────────────────────────────────────

  private _dispatchChange(value: string) {
    this.dispatchEvent(new CustomEvent<{ value: string }>('rc-change', {
      bubbles: true,
      composed: true,
      detail: { value },
    }));
  }

  private _dispatchModeChange(mode: EditorMode) {
    this.dispatchEvent(new CustomEvent<{ mode: EditorMode }>('rc-mode-change', {
      bubbles: true,
      composed: true,
      detail: { mode },
    }));
  }
}
