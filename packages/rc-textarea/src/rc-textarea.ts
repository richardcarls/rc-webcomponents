import { LitElement, html } from 'lit';
import type { CSSResultGroup } from 'lit';
import { property, query } from 'lit/decorators.js';
import { NativeChildController, warnMissingDirectChild } from '@rcarls/rc-common';

import { styles } from './rc-textarea.styles.ts';
import { RCDocument, getText } from './document.ts';
import { saveSelection, restoreSelection, type SavedSelection } from './selection.ts';
import { remapDecorations, addDecoration, setDecorations } from './decoration.ts';
import { matchPatternResults } from './pattern-matcher.ts';

import type {
  Decoration,
  DecorationInput,
  RCTextareaPlugin,
  RCTextareaPluginAPI,
  TextPattern,
  MarkDecoration,
  Token,
} from './types.ts';
import { generateId } from './types.ts';

declare global {
  interface HTMLElementTagNameMap {
    'rc-textarea': RCTextarea;
  }
}

interface UndoEntry {
  value: string;
  anchorOffset: number;
  focusOffset: number;
}

const MAX_UNDO = 100;

/**
 * Parse a highlight.js / prism.js -style HTML string (a flat tree of
 * `<span class="token ...">text</span>` elements) into the supported
 * `MarkDecoration` objects.
 *
 * Only `<span>` elements with a non-empty `className` generate decorations;
 * all other nodes (text, non-span elements) are walked for offset accounting
 * only.
 */
function parseDecorationsFromHtml(html: string): Omit<MarkDecoration, 'id'>[] {
  const $tmp = document.createElement('div');
  $tmp.innerHTML = html;

  const result: Omit<MarkDecoration, 'id'>[] = [];
  let charOffset = 0;

  function walk(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      charOffset += (node as Text).length;

      return;
    }

    if (!(node instanceof HTMLElement)) {
      return;
    }

    const isSpan = node.tagName === 'SPAN' && node.className;
    const startOffset = charOffset;

    for (const child of node.childNodes) {
      walk(child);
    }

    if (isSpan && charOffset > startOffset) {
      result.push({
        type: 'mark',
        from: startOffset,
        to: charOffset,
        className: node.className,
      });
    }
  }

  for (const child of $tmp.childNodes) {
    walk(child);
  }

  return result;
}

/**
 * Progressively enhanced textarea with line decorations, gutter, and plugin API.
 *
 * A native `<textarea>` must be provided as a direct child. It is kept in the
 * DOM so that pre-upgrade usability (form submission, label association, etc.)
 * all work without JavaScript.
 *
 * @example Basic usage
 * ```html
 * <label for="editor">Source</label>
 * <rc-textarea>
 *   <textarea id="editor" name="source"></textarea>
 * </rc-textarea>
 * ```
 *
 * @example Controlled value (JavaScript)
 * ```js
 * const editor = document.querySelector('rc-textarea');
 * editor.value = 'hello world';
 * editor.addEventListener('rc-textarea-change', (e) => {
 *   console.log(e.target.value);
 * });
 * ```
 *
 * @slot - Accepts a native `<textarea>` element for form wiring and progressive enhancement.
 *
 * @fires rc-textarea-change - Fired when the field value changes
 * @fires rc-textarea-blur - Fired when the field loses focus
 *
 * @cssprop [--rc-textarea-border=1px solid ButtonBorder] - Border around the field
 * @cssprop [--rc-textarea-border-radius=2px] - Border radius of the field
 * @cssprop [--rc-textarea-background=Field] - Background color of the field
 * @cssprop [--rc-textarea-color=FieldText] - Text color; falls back through --rc-text
 * @cssprop [--rc-textarea-font-family=monospace] - Font family
 * @cssprop [--rc-textarea-font-size=1em] - Font size
 * @cssprop [--rc-textarea-line-height=1.5] - Line height
 * @cssprop [--rc-textarea-padding=0.5em] - Padding inside the field area
 * @cssprop [--rc-textarea-focus-outline=2px solid Highlight] - Focus ring outline
 * @cssprop [--rc-textarea-caret-color=FieldText] - Caret color
 * @cssprop [--rc-textarea-active-line-bg=transparent] - Active line highlight color
 * @cssprop [--rc-textarea-gutter-bg=Canvas] - Gutter background color
 * @cssprop [--rc-textarea-gutter-color=GrayText] - Gutter text color
 * @cssprop [--rc-textarea-gutter-border=1px solid ButtonBorder] - Gutter right border
 */
export class RCTextarea extends LitElement {
  static override styles: CSSResultGroup = styles;
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  /** Show sequential line numbers in the gutter. Enables the gutter implicitly. */
  @property({ type: Boolean, attribute: 'line-numbers', reflect: true })
  lineNumbers = false;

  /**
   * @deprecated Use a plugin with `LineDecoration.gutterContent` to implement
   * sparse line numbering. This property will be removed before v1.0.
   */
  @property({ type: Boolean, attribute: 'list-numbers', reflect: true })
  get listNumbers(): boolean {
    return this._listNumbers;
  }

  set listNumbers(value: boolean) {
    if (value) {
      console.warn(
        '[rc-textarea] `listNumbers` / `list-numbers` is deprecated and will be removed before v1.0. ' +
          'Use a plugin with `LineDecoration.gutterContent` to implement sparse line numbering.',
      );
    }

    const old = this._listNumbers;

    this._listNumbers = value;
    this.requestUpdate('listNumbers', old);
  }

  private _listNumbers = false;

  /**
   * Enable the gutter column without any built-in content.
   *
   * Plugins can populate individual cells via `LineDecoration.gutterContent`.
   * For sequential line numbers use `lineNumbers` / `line-numbers` instead.
   */
  @property({ type: Boolean, attribute: 'gutter', reflect: true })
  gutter = false;

  /** Wrap long lines within the field to prevent horizontal overflow. */
  @property({ type: Boolean, attribute: 'word-wrap', reflect: true })
  wordWrap = false;

  /** Allow the field to grow vertically with content to prevent vertical overflow. */
  @property({ type: Boolean, attribute: 'auto-grow', reflect: true })
  autoGrow = false;

  /** Disable editing. The field renders as a styled read-only display. */
  @property({ type: Boolean, attribute: 'read-only', reflect: true })
  readOnly = false;

  /**
   * @deprecated Set `aria-label` on the slotted `<textarea>` instead, or
   * associate a `<label>` element via its `for`/`id` pair. This property
   * will be removed before v1.0.
   */
  @property({ type: String })
  get label(): string | null {
    return this._label;
  }

  set label(value: string | null) {
    if (value) {
      console.warn(
        '[rc-textarea] `label` is deprecated and will be removed before v1.0. ' +
          'Set `aria-label` on the slotted `<textarea>`, or associate a `<label>` ' +
          'element via its `for`/`id` pair instead.',
      );
    }

    const old = this._label;

    this._label = value;

    this.requestUpdate('label', old);
  }

  private _label: string | null = null;

  /** Declarative plugin hook for framework integrations. */
  @property({ attribute: false })
  get plugin(): RCTextareaPlugin | null {
    return this._pluginProperty;
  }

  /** Declarative plugin hook for framework integrations. */
  set plugin(plugin: RCTextareaPlugin | null) {
    const oldPlugin = this._pluginProperty;

    if (plugin === oldPlugin) {
      return;
    }

    this._pluginProperty = plugin;

    if (plugin) {
      this.usePlugin(plugin);
    } else {
      this.removePlugin();
    }

    this.requestUpdate('plugin', oldPlugin);
  }

  /**
   * Imperatively set an external layer of decorations. Ideal for reactive frameworks.
   *
   * ```tsx
   * // Solid
   * <rc-textarea decorations={decorations()} />
   *
   * // React 19+
   * <rc-textarea decorations={decorations} />
   * ```
   *
   * Merges with plugin decorations and pattern decorations on every render.
   * Setting this property triggers a new render; setting it to `undefined` or `[]`
   * clears any previously set external decorations.
   */
  @property({ attribute: false })
  get decorations(): DecorationInput[] {
    return this._externalDecorations;
  }

  set decorations(value: DecorationInput[] | undefined) {
    this._externalDecorations = value ?? [];
    this.requestUpdate();
  }

  @query('#editor', true)
  protected _$editor!: HTMLElement;

  @query('#gutter-cells', true)
  protected _$gutterCells!: HTMLElement;

  @query('slot', true)
  protected _$slot!: HTMLSlotElement;

  private _value = '';
  private _defaultValue: string | undefined;
  private _initialValueResolved = false;
  private _valueSetByHost = false;
  private _document: RCDocument | null = null;
  private _$textareaRef: WeakRef<HTMLTextAreaElement> | null = null;

  private readonly _textareaController = new NativeChildController<HTMLTextAreaElement>(this, {
    selector: ':scope > textarea',
    observe: true,
    onChange: ($textarea, $previousTextarea) =>
      this._setupTextarea($textarea, $previousTextarea),
    onMissing: () => {
      if (import.meta.env.DEV && !this.readOnly) {
        warnMissingDirectChild(this, {
          selector: ':scope > textarea',
          message:
            '[rc-textarea] No direct child <textarea> found. Place a native <textarea> inside <rc-textarea>.',
        });
      }
    },
  });

  /** Plugin-owned decorations */
  protected _pluginDecorations = new Map<string, Decoration>();

  /** Pattern-generated decorations (rebuilt on each value change). */
  private _patternDecorations: Decoration[] = [];

  /** Imperative decorations (set directly via the `decorations` property) */
  private _externalDecorations: DecorationInput[] = [];

  /** Registered patterns. */
  private _patterns = new Map<string, TextPattern>();

  protected _plugin: RCTextareaPlugin | null = null;
  private _pluginProperty: RCTextareaPlugin | null = null;
  protected _pluginApi: RCTextareaPluginAPI | null = null;

  /** Sequence counter for async plugin safety (discard stale results). */
  private _pluginSeq = 0;

  /** Stylesheets adopted into the shadow root by the active plugin. */
  private _pluginSheets = new Set<CSSStyleSheet>();

  protected _savedSelection: SavedSelection | null = null;
  private _rafHandle: number | null = null;
  private _composing = false;
  private _isRendering = false;

  /** The currently highlighted `.line` element (active line). */
  private _$activeLine: HTMLElement | null = null;

  /** Callbacks registered via PluginAPI.onCursorMove(). */
  private _cursorCallbacks = new Set<(start: number, end: number) => void>();

  private _docSelectionChangeHandler = (): void => {
    if (document.activeElement !== this) {
      return;
    }

    this._onSelectionChange();
  };

  /** Synthetic undo/redo stack (DOM rebuilds invalidate native undo) */
  private _undoStack: UndoEntry[] = [];
  private _undoIndex = -1;

  private _resizeObserver: ResizeObserver | null = null;

  /** Cached per-line gutter labels from the last render — reused by ResizeObserver. */
  private _gutterLabels: (string | null)[] = [];

  /**
   * The current field value.
   *
   * Setting this property puts the component into
   * controlled mode (host owns the value, changes are reflected
   * immediately, no change events dispatched)
   */
  @property({ type: String })
  get value(): string {
    return this._value;
  }

  set value(val: string) {
    const oldValue = this._value;

    if (val === this._value) {
      return;
    }

    this._valueSetByHost = true;
    this._initialValueResolved = true;
    this._value = val;

    this._syncTextareaValue();
    this._scheduleRender();
    this.requestUpdate('value', oldValue);
  }

  /** Initial uncontrolled value. */
  @property({ type: String })
  get defaultValue(): string | undefined {
    return this._defaultValue;
  }

  set defaultValue(val: string | undefined) {
    const oldValue = this._defaultValue;

    this._defaultValue = val;

    if (!this._valueSetByHost && !this._initialValueResolved && val !== undefined) {
      this._value = val;
      this._initialValueResolved = true;

      this._syncTextareaValue();
      this._scheduleRender();
    }

    this.requestUpdate('defaultValue', oldValue);
  }

  override connectedCallback(): void {
    super.connectedCallback();

    document.addEventListener('selectionchange', this._docSelectionChangeHandler);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();

    document.removeEventListener('selectionchange', this._docSelectionChangeHandler);

    this._plugin?.destroy?.();
    this._plugin = null;
    this._pluginApi = null;

    this._clearPluginSheets();

    this._cursorCallbacks.clear();
    this._resizeObserver?.disconnect();
    this._$textareaRef?.deref()?.removeEventListener('invalid', this._onTextareaInvalid);

    if (this._rafHandle !== null) {
      cancelAnimationFrame(this._rafHandle);

      this._rafHandle = null;
    }
  }

  override firstUpdated(): void {
    if (this._$editor) {
      this._document = new RCDocument(this._$editor as HTMLDivElement);
      this._bindEditorEvents(this._$editor);
    }

    this._resizeObserver = new ResizeObserver(() => {
      this._syncGutter();
      this._syncGutterHeights();
    });

    this._resizeObserver.observe(this);

    // In editable mode a slotted <textarea> fires slotchange, which calls
    // _onSlotChange → _scheduleRender. In read-only mode no textarea is
    // required, so slotchange may never fire; call _scheduleRender here to seed
    // the first render when value/defaultValue was set before upgrade or connection.
    this._scheduleRender();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('readOnly')) {
      if (this._$editor) {
        this._$editor.contentEditable = this.readOnly ? 'false' : 'true';
      }

      this._syncGutterHeights();
      this._textareaController.sync();
    }

    if (changed.has('label')) {
      this._syncLabel();
    }
  }

  override render() {
    return html`
      <div id="root" part="root">
        <div id="gutter" part="gutter" aria-hidden="true">
          <div id="gutter-cells" part="gutter-cells"></div>
        </div>

        <div id="editor-area" part="editor-area">
          <div
            id="editor"
            part="editor"
            contenteditable=${this.readOnly ? 'false' : 'true'}
            role="textbox"
            aria-multiline="true"
            spellcheck="false"
            autocorrect="off"
            autocapitalize="off"
          ></div>

          <slot @slotchange=${this._onSlotChange}></slot>
        </div>
      </div>
    `;
  }

  private _onSlotChange(): void {
    this._textareaController.sync();
  }

  private _setupTextarea(
    $textarea: HTMLTextAreaElement | null,
    $previousTextarea?: HTMLTextAreaElement | null,
  ): void {
    if ($previousTextarea && $previousTextarea !== $textarea) {
      $previousTextarea.removeEventListener('invalid', this._onTextareaInvalid);
    }

    if (!$textarea) {
      this._$textareaRef = null;

      return;
    }

    this._$textareaRef = new WeakRef($textarea);

    // Visually hide — keep in DOM for form submission
    Object.assign($textarea.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0,0,0,0)',
      border: '0',
      opacity: '0',
      pointerEvents: 'none',
      tabIndex: '-1',
    });

    $textarea.setAttribute('aria-hidden', 'true');
    $textarea.tabIndex = -1;

    // Sync attributes from textarea → editor ARIA / state
    if (this._$editor) {
      this._syncLabel();

      const placeholder = $textarea.getAttribute('placeholder');

      if (placeholder) {
        this._$editor.setAttribute('aria-placeholder', placeholder);
      }
    }

    // Adopt initial value from textarea after value/defaultValue precedence.
    if (!this._initialValueResolved) {
      this._value = $textarea.value;
      this._initialValueResolved = true;
    } else {
      $textarea.value = this._value;
    }

    // Wire up form validation feedback
    $textarea.addEventListener('invalid', this._onTextareaInvalid);

    // Sync typography from textarea's computed style to editor
    this._syncTypography($textarea);

    this._scheduleRender();
  }

  private _onTextareaInvalid = (): void => {
    if (this._$editor) {
      this._$editor.setAttribute('aria-invalid', 'true');
    }
  };

  private _bindEditorEvents($editor: HTMLElement): void {
    $editor.addEventListener('compositionstart', () => {
      this._composing = true;
    });

    $editor.addEventListener('compositionend', () => {
      this._composing = false;
      this._onInput();
    });

    $editor.addEventListener('input', this._onInputEvent);
    $editor.addEventListener('keydown', this._onKeyDown);
    $editor.addEventListener('paste', this._onPaste);
    $editor.addEventListener('focus', () => {
      this.dispatchEvent(
        new CustomEvent('rc-textarea-focus', {
          bubbles: true,
          composed: true,
        }),
      );
    });

    $editor.addEventListener('blur', () => {
      this.dispatchEvent(
        new CustomEvent('rc-textarea-blur', {
          bubbles: true,
          composed: true,
        }),
      );

      // Clear active line when editor loses focus
      this._$activeLine?.classList.remove('line--active');
      this._$activeLine = null;
    });

    // Note: Selection tracking is handled by the document-level selectionchange listener
  }

  private _onInputEvent = (): void => {
    if (!this._composing) {
      this._onInput();
    }
  };

  private _onInput(): void {
    if (!this._$editor) {
      return;
    }

    const newValue = getText(this._$editor);

    if (newValue === this._value) {
      return;
    }

    const oldValue = this._value;
    const preEditSelection = this._savedSelection;

    // Map existing plugin decorations through the text change
    const mappedDecorations = remapDecorations(
      [...this._pluginDecorations.values()],
      oldValue,
      newValue,
    );

    this._pluginDecorations.clear();

    for (const decoration of mappedDecorations) {
      this._pluginDecorations.set(decoration.id, decoration);
    }

    this._value = newValue;
    this._syncTextareaValue(true);

    // Save cursor position after input settles
    this._savedSelection = saveSelection(this._$editor);

    // On the very first edit, capture the pre-edit state as the undo baseline
    if (this._undoStack.length === 0) {
      // Note: selectionchange fires AFTER input, so _savedSelection still holds the
      // pre-edit cursor at this point (before saveSelection() overwrites it above).
      this._undoStack.push({
        value: oldValue,
        anchorOffset: preEditSelection?.anchorOffset ?? 0,
        focusOffset: preEditSelection?.focusOffset ?? 0,
      });
      this._undoIndex = 0;
    }

    // Push to undo stack
    this._pushUndo(this._savedSelection);
    this._dispatchChange(newValue);

    this._scheduleRender();
  }

  private _onSelectionChange = (): void => {
    if (!this._$editor) {
      return;
    }

    const selection = saveSelection(this._$editor);

    if (selection) {
      this._savedSelection = selection;
      this.dispatchEvent(
        new CustomEvent('rc-textarea-select', {
          bubbles: true,
          composed: true,
          detail: {
            selectionStart: selection.anchorOffset,
            selectionEnd: selection.focusOffset,
          },
        }),
      );

      this._updateActiveLine();

      const start = Math.min(selection.anchorOffset, selection.focusOffset);
      const end = Math.max(selection.anchorOffset, selection.focusOffset);

      for (const callback of this._cursorCallbacks) {
        callback(start, end);
      }
    }
  };

  private _updateActiveLine(): void {
    if (!this._$editor) {
      return;
    }

    const selection =
      (
        this.shadowRoot as unknown as { /* (Chrome 53+) */ getSelection?: () => Selection | null }
      ).getSelection?.() ?? window.getSelection();

    let $line: HTMLElement | null = null;

    if (selection?.focusNode && this._$editor.contains(selection.focusNode)) {
      let node: Node | null = selection.focusNode;

      while (node && node !== this._$editor) {
        if (node instanceof HTMLElement && node.classList.contains('line')) {
          $line = node;

          break;
        }

        node = node.parentNode;
      }
    }

    if ($line === this._$activeLine) {
      return;
    }

    this._$activeLine?.classList.remove('line--active');
    this._$activeLine = $line;
    this._$activeLine?.classList.add('line--active');

    // Update active line number highlight
    this._updateActiveGutterCell();
  }

  private _updateActiveGutterCell(): void {
    if (!this._$gutterCells) {
      return;
    }

    // Find and remove previous active state
    const $previousActive = this._$gutterCells.querySelector('.gutter-cell--active');

    if ($previousActive) {
      $previousActive.classList.remove('gutter-cell--active');
    }

    // Find line index and highlight corresponding line number
    if (this._$activeLine) {
      if (!this._$editor) {
        return;
      }

      const $lines = this._$editor.querySelectorAll('.line');

      for (let i = 0; i < $lines.length; i++) {
        if ($lines[i] === this._$activeLine) {
          const $lineNumber = this._$gutterCells.children[i];

          if ($lineNumber) {
            $lineNumber.classList.add('gutter-cell--active');
          }

          break;
        }
      }
    }
  }

  private _onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      this._insertText('\t');
      return;
    }

    const isUndo = (e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey;
    const isRedo =
      ((e.ctrlKey || e.metaKey) && e.key === 'y') ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z');

    if (isUndo) {
      e.preventDefault();
      this._undo();
      return;
    }
    if (isRedo) {
      e.preventDefault();
      this._redo();
    }
  };

  protected _insertText(text: string): void {
    if (!this._$editor) {
      return;
    }

    // execCommand('insertText') does not handle \n — browsers create new divs
    // that lack the 'line' class, so getText() loses all content
    // after the first newline. Apply multi-line inserts directly to the value model.
    if (text.includes('\n')) {
      const selection = saveSelection(this._$editor) ?? this._savedSelection;
      const anchor = Math.min(selection?.anchorOffset ?? 0, selection?.focusOffset ?? 0);
      const focus = Math.max(selection?.anchorOffset ?? 0, selection?.focusOffset ?? 0);
      const oldValue = this._value;
      const newValue = oldValue.slice(0, anchor) + text + oldValue.slice(focus);
      const newCursorOffset = anchor + text.length;

      const mappedDecorations = remapDecorations(
        [...this._pluginDecorations.values()],
        oldValue,
        newValue,
      );

      this._pluginDecorations.clear();

      for (const decoration of mappedDecorations) {
        this._pluginDecorations.set(decoration.id, decoration);
      }

      this._value = newValue;
      this._syncTextareaValue(true);
      this._savedSelection = {
        anchorOffset: newCursorOffset,
        focusOffset: newCursorOffset,
      };
      if (this._undoStack.length === 0) {
        this._undoStack.push({
          value: oldValue,
          anchorOffset: selection?.anchorOffset ?? 0,
          focusOffset: selection?.focusOffset ?? 0,
        });
        this._undoIndex = 0;
      }

      this._pushUndo(this._savedSelection);
      this._dispatchChange(newValue);
      this._scheduleRender();

      return;
    }

    // Use execCommand for simple (single-line) insertions — maintains a minimal
    // undo step until our full rebuild fires on the next RAF.
    document.execCommand('insertText', false, text);
    this._onInput();
  }

  /**
   * Wrap the current selection with `prefix` and `suffix`.
   * No-op when the selection is collapsed (no text selected).
   *
   * Uses the model path directly (not `execCommand`) because callers such as
   * toolbar buttons move focus away from the editor before this fires, which
   * clears the DOM selection. `_savedSelection` retains the last model-level
   * anchor/focus offsets.
   */
  wrapSelection(prefix: string, suffix: string): void {
    if (!this._$editor) {
      return;
    }

    const selection = saveSelection(this._$editor) ?? this._savedSelection;

    if (!selection || selection.anchorOffset === selection.focusOffset) {
      return;
    }

    const start = Math.min(selection.anchorOffset, selection.focusOffset);
    const end = Math.max(selection.anchorOffset, selection.focusOffset);
    const selected = this._value.slice(start, end);
    const oldValue = this._value;
    const newValue = oldValue.slice(0, start) + prefix + selected + suffix + oldValue.slice(end);

    const mappedDecorations = remapDecorations(
      [...this._pluginDecorations.values()],
      oldValue,
      newValue,
    );

    this._pluginDecorations.clear();

    for (const decoration of mappedDecorations) {
      this._pluginDecorations.set(decoration.id, decoration);
    }

    this._value = newValue;
    this._syncTextareaValue(true);
    this._savedSelection = {
      anchorOffset: start + prefix.length,
      focusOffset: start + prefix.length + selected.length,
    };
    this._pushUndo(this._savedSelection);
    this._dispatchChange(newValue);
    this._scheduleRender();
  }

  /**
   * Replace the current selection with `text`.
   * When the selection is collapsed this is equivalent to `insertText`.
   */
  replaceSelection(text: string): void {
    this._insertText(text);
  }

  private _onPaste = (e: ClipboardEvent): void => {
    e.preventDefault();

    const text = e.clipboardData?.getData('text/plain') ?? '';

    if (!text) {
      return;
    }

    // Normalize line endings
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    this._insertText(normalized);
  };

  /** Reset the undo/redo history. Call when the field receives entirely new content. */
  clearHistory(): void {
    this._undoStack = [];
    this._undoIndex = -1;
  }

  protected _pushUndo(sel: SavedSelection | null): void {
    const entry: UndoEntry = {
      value: this._value,
      anchorOffset: sel?.anchorOffset ?? 0,
      focusOffset: sel?.focusOffset ?? 0,
    };

    // Truncate redo branch
    this._undoStack = this._undoStack.slice(0, this._undoIndex + 1);
    this._undoStack.push(entry);

    if (this._undoStack.length > MAX_UNDO) {
      this._undoStack.shift();
    }

    this._undoIndex = this._undoStack.length - 1;
  }

  private _undo(): void {
    if (this._undoIndex <= 0) {
      return;
    }

    this._undoIndex--;
    this._applyUndoEntry(this._undoStack[this._undoIndex]!);
  }

  private _redo(): void {
    if (this._undoIndex >= this._undoStack.length - 1) {
      return;
    }

    this._undoIndex++;
    this._applyUndoEntry(this._undoStack[this._undoIndex]!);
  }

  private _applyUndoEntry(entry: UndoEntry): void {
    this._value = entry.value;
    this._savedSelection = {
      anchorOffset: entry.anchorOffset,
      focusOffset: entry.focusOffset,
    };
    this._syncTextareaValue(true);
    this._dispatchChange(this._value);
    this._scheduleRender();
  }

  /**
   * Register and mount a plugin imperatively.
   * Replaces any currently active plugin. Prefer the `plugin` property for
   * reactive-framework integrations.
   */
  usePlugin(plugin: RCTextareaPlugin): void {
    this._plugin?.destroy?.();
    this._clearPluginSheets();
    this._pluginDecorations.clear();
    this._cursorCallbacks.clear();
    this._pluginSeq++;

    this._plugin = plugin;
    this._pluginApi = this._buildPluginApi();
    plugin.mount?.(this._pluginApi);

    this._scheduleRender();
  }

  /** Unmount the active plugin, clear its decorations, and release its stylesheets. */
  removePlugin(): void {
    this._plugin?.destroy?.();
    this._clearPluginSheets();
    this._plugin = null;
    this._pluginApi = null;
    this._pluginDecorations.clear();
    this._cursorCallbacks.clear();
    this._pluginSeq++;
    this._scheduleRender();
  }

  /**
   * Build the `RCTextareaPluginAPI` object passed to the active plugin's
   * `mount()` call. Each getter delegates to the component's live state so the
   * API stays accurate across render frames without needing to be rebuilt.
   */
  private _buildPluginApi(): RCTextareaPluginAPI {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const component = this;
    return {
      get host() {
        return component;
      },
      get value() {
        return component._value;
      },
      get selectionStart() {
        const selection = component._savedSelection;

        return selection ? Math.min(selection.anchorOffset, selection.focusOffset) : 0;
      },
      get selectionEnd() {
        const selection = component._savedSelection;

        return selection ? Math.max(selection.anchorOffset, selection.focusOffset) : 0;
      },
      getCursorRect(): DOMRect | null {
        const selection = window.getSelection();

        if (!selection?.focusNode) {
          return null;
        }

        if (!component._$editor || !component._$editor.contains(selection.focusNode)) {
          return null;
        }

        try {
          const $range = document.createRange();

          $range.setStart(selection.focusNode, selection.focusOffset);
          $range.collapse(true);

          const rect = $range.getBoundingClientRect();

          return rect.height > 0 ? rect : null;
        } catch {
          return null;
        }
      },
      getWordAtCursor(): { word: string; from: number; to: number } | null {
        const offset = component._savedSelection?.focusOffset ?? 0;
        const text = component._value;

        if (!text) {
          return null;
        }

        let start = offset;

        while (start > 0 && /\w/.test(text[start - 1]!)) {
          start--;
        }

        let end = offset;

        while (end < text.length && /\w/.test(text[end]!)) {
          end++;
        }

        if (start === end) {
          return null;
        }

        return { word: text.slice(start, end), from: start, to: end };
      },
      onCursorMove(callback: (selectionStart: number, selectionEnd: number) => void): () => void {
        component._cursorCallbacks.add(callback);
        return () => {
          component._cursorCallbacks.delete(callback);
        };
      },

      addDecoration(d: DecorationInput): string {
        return addDecoration(component._pluginDecorations, d);
      },
      removeDecoration(id: string): void {
        component._pluginDecorations.delete(id);
      },
      clearDecorations(): void {
        component._pluginDecorations.clear();
      },
      setDecorations(decorations: DecorationInput[]): void {
        setDecorations(component._pluginDecorations, decorations);
      },
      getDecorations(): readonly Decoration[] {
        return [...component._pluginDecorations.values()];
      },
      scheduleUpdate(): void {
        if (!component._isRendering) {
          component._scheduleRender();
        }
      },
      adoptStyleSheet(sheetOrCssText: CSSStyleSheet | string): CSSStyleSheet {
        let sheet: CSSStyleSheet;

        if (typeof sheetOrCssText === 'string') {
          sheet = new CSSStyleSheet();
          sheet.replaceSync(sheetOrCssText);
        } else {
          sheet = sheetOrCssText;
        }

        const $shadowRoot = component.shadowRoot;

        if ($shadowRoot && !$shadowRoot.adoptedStyleSheets.includes(sheet)) {
          $shadowRoot.adoptedStyleSheets = [...$shadowRoot.adoptedStyleSheets, sheet];
        }

        component._pluginSheets.add(sheet);

        return sheet;
      },
      removeStyleSheet(sheet: CSSStyleSheet): void {
        const $shadowRoot = component.shadowRoot;

        if ($shadowRoot) {
          $shadowRoot.adoptedStyleSheets = $shadowRoot.adoptedStyleSheets.filter(
            (s) => s !== sheet,
          );
        }

        component._pluginSheets.delete(sheet);
      },
      parseDecorationsFromHtml(html: string): Omit<MarkDecoration, 'id'>[] {
        return parseDecorationsFromHtml(html);
      },
      /** @deprecated Use `parseDecorationsFromHtml` instead. */
      decorationsFromHtml(html: string): Omit<MarkDecoration, 'id'>[] {
        return parseDecorationsFromHtml(html);
      },
      decorationsFromTokens(
        tokens: Token[],
        themeMap: Record<string, Omit<MarkDecoration, 'id' | 'type' | 'from' | 'to'>>,
      ): Omit<MarkDecoration, 'id'>[] {
        const result: Omit<MarkDecoration, 'id'>[] = [];

        for (const token of tokens) {
          const style = themeMap[token.type];

          if (style) {
            result.push({
              type: 'mark',
              from: token.from,
              to: token.to,
              ...style,
            });
          }
        }

        return result;
      },
      insertText(text: string): void {
        component._insertText(text);
      },
      wrapSelection(prefix: string, suffix: string): void {
        component.wrapSelection(prefix, suffix);
      },
      replaceSelection(text: string): void {
        component.replaceSelection(text);
      },
    };
  }

  private _clearPluginSheets(): void {
    if (this._pluginSheets.size === 0) {
      return;
    }

    const $shadowRoot = this.shadowRoot;

    if ($shadowRoot) {
      $shadowRoot.adoptedStyleSheets = $shadowRoot.adoptedStyleSheets.filter(
        (s) => !this._pluginSheets.has(s),
      );
    }

    this._pluginSheets.clear();
  }

  /**
   * Register a text pattern that generates decorations on every render pass.
   * Returns the pattern ID, which can be passed to `removePattern` to unregister it.
   */
  addPattern(pattern: Omit<TextPattern, 'id'>): string {
    const id = generateId();
    this._patterns.set(id, { ...pattern, id });
    this._scheduleRender();
    return id;
  }

  /** Remove a previously registered pattern by the ID returned from `addPattern`. */
  removePattern(id: string): void {
    this._patterns.delete(id);
    this._scheduleRender();
  }

  /** Remove all registered patterns and trigger a re-render. */
  clearPatterns(): void {
    this._patterns.clear();
    this._scheduleRender();
  }

  protected _scheduleRender(): void {
    if (this._rafHandle !== null) {
      return;
    }

    this._rafHandle = requestAnimationFrame(() => {
      this._rafHandle = null;
      void this._performRender();
    });
  }

  private async _performRender(): Promise<void> {
    if (!this._document) {
      return;
    }

    this._isRendering = true;

    // Snapshot the sequence counter so we can detect if a newer render was
    // scheduled while we were awaiting an async plugin. If the counters
    // diverge on resume, discard this render's results.
    const renderSeq = ++this._pluginSeq;

    try {
      // Resolve display value: apply transform hook (read-only only) before everything else
      let renderValue = this._value;

      if (this._plugin && this._pluginApi && this._plugin.transform && this.readOnly) {
        const transformed = this._plugin.transform(this._value, this._pluginApi);

        if (typeof transformed === 'string') {
          renderValue = transformed;
        }
      }

      // Run pattern matcher
      const { markDecorations: patMarkDecs, lineDecorations: patLineDecs } = matchPatternResults(
        renderValue,
        [...this._patterns.values()],
      );
      this._patternDecorations = [
        ...patMarkDecs.map((d) => ({ ...d, id: generateId() })),
        ...patLineDecs.map((d) => ({ ...d, id: generateId() })),
      ];

      // Run plugin (update + highlight)
      if (this._plugin && this._pluginApi) {
        const api = this._pluginApi;

        if (this._plugin.update) {
          await this._plugin.update(renderValue, api);

          if (renderSeq !== this._pluginSeq) {
            return;
          }
        }

        if (this._plugin.highlight) {
          const html = await this._plugin.highlight(renderValue, api);

          if (renderSeq !== this._pluginSeq) {
            return;
          }

          if (typeof html === 'string') {
            const decorations = parseDecorationsFromHtml(html);

            // Add parsed decorations on top of existing plugin decorations
            for (const decoration of decorations) {
              addDecoration(this._pluginDecorations, decoration);
            }
          }
        }
      }

      // Merge all decoration sources
      const allDecorations: Decoration[] = [
        ...this._pluginDecorations.values(),
        ...this._patternDecorations,
        ...this._externalDecorations.map((d) => ({ ...d, id: generateId() })),
      ];

      // Rebuild the Parchment tree
      if (!this._$editor) {
        return;
      }

      this._document.build(renderValue, allDecorations);

      // Restore cursor
      if (this._savedSelection) {
        restoreSelection(this._$editor, this._savedSelection);
      }

      // Re-apply active line (DOM was rebuilt; old reference is stale)
      this._$activeLine = null;
      this._updateActiveLine();

      // Update gutter
      this._syncGutter(this._computeGutterLabels(allDecorations, renderValue));
      this._syncGutterHeights();
    } finally {
      this._isRendering = false;
    }
  }

  /**
   * Compute the label string for each gutter cell based on the current gutter
   * mode (`lineNumbers`, `listNumbers` (deprecated), `gutter`) and any
   * `LineDecoration.gutterContent` overrides in `allDecorations`.
   *
   * Returns one entry per line (same length as `value.split('\n')`):
   * - `string` — the label to display
   * - `null`   — render an empty cell
   */
  private _computeGutterLabels(
    allDecorations: Decoration[],
    value = this._value,
  ): (string | null)[] {
    const lines = value.split('\n');

    const overrides = new Map<number, string | null>();

    for (const dec of allDecorations) {
      if (dec.type === 'line' && dec.gutterContent !== undefined) {
        overrides.set(dec.line, dec.gutterContent);
      }
    }

    let counter = 0;
    return lines.map((lineText, i) => {
      const lineNum = i + 1;

      if (overrides.has(lineNum)) {
        return overrides.get(lineNum)!;
      }

      if (this.lineNumbers) {
        return String(lineNum);
      }

      if (this.listNumbers) {
        if (lineText.trim() === '') {
          return null;
        }

        counter++;

        return `${counter}.`;
      }

      // `gutter` mode is empty by default, and plugins fill via overrides.
      return null;
    });
  }

  /**
   * Synchronize the pixel height of each gutter cell to match the
   * corresponding `.line` element in the editor.
   *
   * In non-word-wrap mode the gutter uses a uniform `line-height` mirrored
   * from the editor's first line. In word-wrap mode each cell gets an explicit
   * `height` so wrapped lines stay vertically aligned with their gutter label.
   * Also copies the editor's computed `paddingTop`/`paddingBottom` to the
   * gutter to compensate for browser UA overrides on contenteditable.
   */
  private _syncGutterHeights(): void {
    if (!this._$gutterCells || !this._$editor) {
      return;
    }

    // Sync vertical padding from the editor's computed values.
    // Browser UA overrides (Chrome/Firefox on contenteditable) cause 0.5em to
    // resolve to different pixel values on the gutter vs the editor, producing
    // a constant vertical offset. The read-only rule (padding: 0 on #editor)
    // also needs the gutter to match — this one call covers both cases.
    const computedStyle = getComputedStyle(this._$editor);
    const paddingTop = computedStyle.paddingTop;
    const paddingBottom = computedStyle.paddingBottom;

    if (this._$gutterCells.style.paddingTop !== paddingTop) {
      this._$gutterCells.style.paddingTop = paddingTop;
    }

    if (this._$gutterCells.style.paddingBottom !== paddingBottom) {
      this._$gutterCells.style.paddingBottom = paddingBottom;
    }

    const $lineEls = this._$editor.querySelectorAll<HTMLElement>('.line');
    const $spans = this._$gutterCells.children;

    if (!this.wordWrap) {
      // Chrome UA overrides line-height on contenteditable (even via var() fallback,
      // but not inline styles), giving the editor a different natural cell height
      // than the gutter's CSS 1.5× value. Mirror the first line's actual height.
      if ($lineEls.length > 0) {
        const lineHeight = `${$lineEls[0].getBoundingClientRect().height}px`;

        if (this._$gutterCells.style.lineHeight !== lineHeight) {
          this._$gutterCells.style.lineHeight = lineHeight;
        }
      }

      for (let i = 0; i < $spans.length; i++) {
        ($spans[i] as HTMLElement).style.height = '';
      }

      return;
    }

    // word-wrap: per-span explicit heights drive alignment; clear any forced line-height.
    if (this._$gutterCells.style.lineHeight) {
      this._$gutterCells.style.lineHeight = '';
    }

    for (let i = 0; i < $lineEls.length && i < $spans.length; i++) {
      const height = $lineEls[i]!.getBoundingClientRect().height;
      const heightStyle = `${height}px`;
      const $span = $spans[i] as HTMLElement;

      if ($span.style.height !== heightStyle) {
        $span.style.height = heightStyle;
      }
    }
  }

  /**
   * Add, remove, or update `.gutter-cell` spans so their count and text
   * content match `labels`. When `labels` is provided the cached
   * `_gutterLabels` is updated first; otherwise the cached labels are reused
   * (called by the `ResizeObserver` without a new render pass).
   */
  private _syncGutter(labels?: (string | null)[]): void {
    if (!this.lineNumbers && !this.listNumbers && !this.gutter) {
      return;
    }

    if (!this._$gutterCells) {
      return;
    }

    if (labels !== undefined) {
      this._gutterLabels = labels;
    }

    const current = this._gutterLabels;

    // Sync count
    while (this._$gutterCells.children.length < current.length) {
      const $span = document.createElement('span');

      $span.className = 'gutter-cell';
      this._$gutterCells.appendChild($span);
    }

    while (this._$gutterCells.children.length > current.length) {
      this._$gutterCells.removeChild(this._$gutterCells.lastChild!);
    }

    // Sync content (only write when changed)
    for (let i = 0; i < current.length; i++) {
      const label = current[i] ?? '';
      const $span = this._$gutterCells.children[i] as HTMLElement;

      if ($span.textContent !== label) {
        $span.textContent = label;
      }
    }
  }

  private _syncLabel(): void {
    if (!this._$editor) {
      return;
    }

    const $textarea = this._$textareaRef?.deref();

    const ariaLabel = $textarea?.getAttribute('aria-label');

    if (ariaLabel) {
      this._$editor.setAttribute('aria-label', ariaLabel);
      return;
    }

    if ($textarea) {
      const labelText = Array.from($textarea.labels ?? [])
        .map(($l) => $l.textContent?.trim())
        .filter(Boolean)
        .join(' ');

      if (labelText) {
        this._$editor.setAttribute('aria-label', labelText);
        return;
      }
    }

    if (this._label) {
      this._$editor.setAttribute('aria-label', this._label);
      return;
    }

    this._$editor.removeAttribute('aria-label');
  }

  private _syncTypography($textarea: HTMLTextAreaElement): void {
    if (!this._$editor) {
      return;
    }

    const textareaStyle = window.getComputedStyle($textarea);
    const props: (keyof CSSStyleDeclaration)[] = [
      'fontFamily',
      'fontSize',
      'fontWeight',
      'fontStyle',
      'fontVariant',
      'lineHeight',
      'letterSpacing',
      'wordSpacing',
      'textIndent',
      'tabSize',
    ];

    // Only copy if the host hasn't set custom properties for these
    const hostStyle = window.getComputedStyle(this);

    if (!hostStyle.getPropertyValue('--rc-textarea-font-family')) {
      for (const prop of props) {
        const value = textareaStyle[prop];

        if (value && typeof value === 'string') {
          (this._$editor.style as unknown as Record<string, string>)[prop as string] = value;
        }
      }
    }
  }

  protected _syncTextareaValue(fromUser = false): void {
    const $textarea = this._$textareaRef?.deref();

    if ($textarea) {
      $textarea.value = this._value;

      if (fromUser) {
        $textarea.dispatchEvent(new InputEvent('input', { bubbles: true }));
      }
    }
  }

  protected _dispatchChange(value: string): void {
    this.dispatchEvent(
      new CustomEvent('rc-textarea-change', {
        bubbles: true,
        composed: true,
        detail: { value },
      }),
    );
  }
}
