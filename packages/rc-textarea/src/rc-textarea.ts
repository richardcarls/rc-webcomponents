import { LitElement, html } from 'lit';
import type { CSSResultGroup } from 'lit';
import { property, query } from 'lit/decorators.js';

import {
  cssZoom,
  FlowController,
  logicalRect,
  NativeChildController,
  resolveFlow,
  warnMissingDirectChild,
} from '@rcarls/rc-common';
import { RCDocument, getText } from './document.js';
import {
  getSelectionFocusNode,
  saveSelection,
  restoreSelection,
  type SavedSelection,
} from './selection.js';
import { remapDecorations, addDecoration, setDecorations } from './decoration.js';
import { matchPatternResults } from './pattern-matcher.js';
import type {
  Decoration,
  DecorationInput,
  RCTextareaPlugin,
  RCTextareaPluginAPI,
  TextPattern,
  MarkDecoration,
  FoldDecoration,
  Token,
} from './types.js';
import { generateId } from './types.js';

import { styles } from './rc-textarea.styles.js';

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

interface FoldBounds {
  from: number;
  to: number;
  anchorEnd: number;
  reveal: () => void;
}

function getFoldBounds(value: string, folds: readonly FoldDecoration[]): FoldBounds[] {
  const lines = value.split('\n');
  const starts: number[] = [];
  let offset = 0;

  for (const line of lines) {
    starts.push(offset);
    offset += line.length + 1;
  }

  return folds.flatMap((fold) => {
    if (fold.fromLine < 2 || fold.toLine < fold.fromLine || fold.toLine > lines.length) {
      return [];
    }

    return [
      {
        from: starts[fold.fromLine - 1]!,
        to: starts[fold.toLine - 1]! + lines[fold.toLine - 1]!.length,
        anchorEnd: starts[fold.fromLine - 2]! + lines[fold.fromLine - 2]!.length,
        reveal: fold.reveal,
      },
    ];
  });
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
 * Textarea wrapper with line decorations, gutter rendering, folding actions, and plugin hooks.
 *
 * Provide a native `<textarea>` as the direct child when the component is
 * editable. Read-only displays may be driven from `value` or `defaultValue`.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-textarea rc-textarea docs}
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
 * @slot - Accepts a native `<textarea>` element for form wiring.
 *
 * @fires rc-textarea-change - Fired when the field value changes
 * @fires rc-textarea-focus - Fired when the field gains focus
 * @fires rc-textarea-blur - Fired when the field loses focus
 * @fires rc-textarea-select - Fired when the selection changes while the editor is focused
 *
 * @csspart root - The outer flex container wrapping the gutter and editor area.
 * @csspart gutter - The gutter column container.
 * @csspart gutter-cells - The gutter's line-label list.
 * @csspart fold-trigger - Native button created by a folding action; style its visual appearance without changing its target or keyboard behavior.
 * @csspart fold-icon - Consumer-supplied icon inside a folding action button, when provided.
 * @csspart editor-area - The container positioning the editor over the slotted textarea.
 * @csspart editor - The contenteditable field surface.
 *
 * @attr line-numbers - Show sequential line numbers in the gutter. Enables the gutter implicitly.
 * @attr gutter - Enable the gutter column without any built-in content.
 * @attr word-wrap - Wrap long lines within the field to prevent horizontal overflow.
 * @attr auto-grow - Allow the field to grow vertically with content to prevent vertical overflow.
 * @attr [data-readonly] - Reflected while the slotted `<textarea>` is `readonly`. The editor stays
 *   focusable and selectable, announces `aria-readonly`, and blocks edits.
 * @attr value - Current field value.
 * @attr default-value - Initial uncontrolled value.
 *
 * @cssprop [--rc-textarea-border=1px solid ButtonBorder] - Border around the field
 * @cssprop [--rc-textarea-border-radius=2px] - Border radius of the field
 * @cssprop [--rc-textarea-background=Field] - Background color of the field
 * @cssprop [--rc-textarea-color=var(--rc-field-text, FieldText)] - Text color
 * @cssprop [--rc-textarea-font-family=monospace] - Font family
 * @cssprop [--rc-textarea-font-size=1em] - Font size
 * @cssprop [--rc-textarea-line-height=1.5] - Line height
 * @cssprop [--rc-textarea-padding-block=0.5em] - Block padding of the editor and gutter; any `padding-block` value
 * @cssprop [--rc-textarea-padding-inline=0.5em] - Inline padding on both sides of the editor and before the gutter; one length, which the active line highlight bleeds through
 * @cssprop [--rc-textarea-gutter-min-inline-size=24px] - Minimum width of the gutter, including its padding
 * @cssprop [--rc-textarea-trailing-size=2.5em] - Reserved inline space and minimum block size for trailing controls
 * @cssprop [--rc-textarea-focus-outline=2px solid Highlight] - Focus ring outline
 * @cssprop [--rc-textarea-caret-color=FieldText] - Caret color
 * @cssprop [--rc-textarea-active-line-bg=transparent] - Active line highlight color, including editor and gutter padding
 * @cssprop [--rc-textarea-gutter-bg=Canvas] - Gutter background color
 * @cssprop [--rc-textarea-gutter-color=GrayText] - Gutter text color
 * @cssprop [--rc-textarea-gutter-border=1px solid ButtonBorder] - Gutter right border
 * @cssprop [--rc-textarea-gutter-font-family=var(--rc-textarea-font-family, monospace)] - Gutter font family
 * @cssprop [--rc-textarea-gutter-content-gap=0.25em] - Gap between a retained line number and custom gutter content
 * @cssprop [--rc-textarea-gutter-padding-inline-end=0.75em] - Space between gutter labels and text
 * @cssprop [--rc-line-actions-gap=2px] - Gap between inline line actions; popover actions default to 4px
 * @cssprop [--rc-line-actions-margin-start=6px] - Inline-start margin before line actions
 * @cssprop [--rc-line-action-padding=1px] - Inline line-action padding; popover actions default to 4px 6px
 * @cssprop [--rc-line-action-border=none] - Line-action border; the popover surface defaults to 1px solid ButtonBorder
 * @cssprop [--rc-line-action-border-radius=3px] - Line-action border radius; the popover surface defaults to 4px
 * @cssprop [--rc-line-action-bg=transparent] - Line-action background; the popover surface defaults to Canvas
 * @cssprop [--rc-line-action-color=inherit] - Line-action color; popover actions default to ButtonText
 * @cssprop [--rc-line-action-font-size=1em] - Inline line-action font size; popover actions default to 0.85em
 * @cssprop [--rc-line-action-opacity=0.4] - Resting opacity of inline line actions
 * @cssprop [--rc-line-action-hover-opacity=1] - Hover and focus opacity of inline line actions
 * @cssprop [--rc-line-action-hover-bg=transparent] - Hover and focus background; popover actions default to ButtonFace
 * @cssprop [--rc-line-action-hover-color=inherit] - Hover and focus text color
 * @cssprop [--rc-line-action-shadow=0 2px 8px color-mix(in srgb, CanvasText 15%, transparent)] - Line-action popover shadow
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

  /**
   * Whether the slotted `<textarea>` is `readonly`. The native control is the
   * source of truth; set `readonly` on it to change this state.
   */
  get readOnly(): boolean {
    return this._readOnly;
  }

  private _readOnly = false;
  private _textareaAttributeObserver: MutationObserver | null = null;

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

    // Framework property bindings can run before the element is connected.
    // Mounting at that point adopts plugin sheets before Lit installs its
    // static sheets, so the initial style adoption can be overwritten.
    if (plugin && this.isConnected) {
      this.usePlugin(plugin);
    } else if (!plugin) {
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

  @query('#editor')
  protected _$editor!: HTMLElement;

  @query('#gutter-cells')
  protected _$gutterCells!: HTMLElement;

  @query('slot')
  protected _$slot!: HTMLSlotElement;

  private _value = '';
  private _defaultValue: string | undefined;
  private _initialValueResolved = false;
  private _valueSetByHost = false;
  protected _document: RCDocument | null = null;
  protected _$textareaRef: WeakRef<HTMLTextAreaElement> | null = null;

  protected readonly _textareaController = new NativeChildController<HTMLTextAreaElement>(this, {
    selector: ':scope > textarea',
    observe: true,
    onChange: ($textarea, $previousTextarea) => this._setupTextarea($textarea, $previousTextarea),
    onMissing: () => {
      if (import.meta.env.DEV) {
        warnMissingDirectChild(this, {
          selector: ':scope > textarea',
          message:
            '[rc-textarea] No direct child <textarea> found. Place a native <textarea> inside <rc-textarea>.',
        });
      }
    },
  });

  protected readonly _flowController = new FlowController(this);

  /** Plugin-owned decorations */
  protected _pluginDecorations = new Map<string, Decoration>();

  /** Pattern-generated decorations (rebuilt on each value change). */
  protected _patternDecorations: Decoration[] = [];

  /** Imperative decorations (set directly via the `decorations` property) */
  private _externalDecorations: DecorationInput[] = [];

  /** Registered patterns. */
  protected _patterns = new Map<string, TextPattern>();

  protected _plugin: RCTextareaPlugin | null = null;
  private _pluginProperty: RCTextareaPlugin | null = null;
  protected _pluginApi: RCTextareaPluginAPI | null = null;

  /** Sequence counter for async plugin safety (discard stale results). */
  protected _pluginSeq = 0;

  /** Stylesheets adopted into the shadow root by the active plugin. */
  protected _pluginSheets = new Set<CSSStyleSheet>();

  protected _savedSelection: SavedSelection | null = null;
  protected _rafHandle: number | null = null;
  protected _composing = false;
  /** Set by Escape: the next Tab moves focus instead of inserting `\t`. */
  private _tabMovesFocus = false;
  protected _isRendering = false;

  /** The currently highlighted `.line` element (active line). */
  protected _$activeLine: HTMLElement | null = null;

  /** Callbacks registered via PluginAPI.onCursorMove(). */
  protected _cursorCallbacks = new Set<(start: number, end: number) => void>();

  protected _docSelectionChangeHandler = (): void => {
    if (document.activeElement !== this) {
      return;
    }

    this._onSelectionChange();
  };

  /** Synthetic undo/redo stack (DOM rebuilds invalidate native undo) */
  protected _undoStack: UndoEntry[] = [];
  protected _undoIndex = -1;

  protected _resizeObserver: ResizeObserver | null = null;

  protected _gutterBlockAxis: 'x' | 'y' | null = null;

  /** Cached per-line gutter labels from the last render — reused by ResizeObserver. */
  protected _gutterLabels: (
    | string
    | HTMLElement
    | null
    | { number: string; content: string | HTMLElement }
  )[] = [];

  /** Gutter cells with explicitly accessible plugin controls. */
  protected _accessibleGutterLines = new Set<number>();

  /** Collapsed source ranges from the most recent render. */
  protected _foldedRanges: FoldDecoration[] = [];

  protected _foldBounds: FoldBounds[] = [];

  protected _hiddenGutterLines = new Set<number>();

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
  @property({ type: String, attribute: 'default-value' })
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

    // Frameworks may temporarily move a custom element through a disconnected
    // tree while preserving its property values. disconnectedCallback tears
    // down plugin effects and styles; remount the still-assigned declarative
    // plugin when the same element reconnects.
    if (this._pluginProperty && !this._plugin) {
      this.usePlugin(this._pluginProperty);
    }

    document.addEventListener('selectionchange', this._docSelectionChangeHandler);

    const $textarea = this._$textareaRef?.deref();

    if ($textarea) {
      this._observeTextarea($textarea);
      this._syncReadOnly();
    }
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
    this._textareaAttributeObserver?.disconnect();
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
      this._syncLabel();
    }

    this._resizeObserver = new ResizeObserver(() => {
      this._syncGutter();
      this._syncGutterHeights();
    });

    this._resizeObserver.observe(this);

    // A slotted <textarea> fires slotchange, which calls _onSlotChange →
    // _scheduleRender, but slotchange may not fire when the textarea was
    // present before upgrade; seed the first render here when value or
    // defaultValue was set before upgrade or connection.
    this._syncReadOnly();
    this._scheduleRender();
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('lineNumbers') || changed.has('gutter')) {
      this._scheduleRender();
    }
  }

  private _observeTextarea($textarea: HTMLTextAreaElement): void {
    this._textareaAttributeObserver ??= new MutationObserver(() => this._syncReadOnly());
    this._textareaAttributeObserver.disconnect();

    this._textareaAttributeObserver.observe($textarea, {
      attributes: true,
      attributeFilter: ['readonly'],
    });
  }

  /**
   * Mirror the native textarea's `readonly` attribute: the editor stays a
   * focusable, selectable textbox that announces `aria-readonly`, and edits
   * are blocked by the existing input guards.
   */
  protected _syncReadOnly(): void {
    const readOnly = this._$textareaRef?.deref()?.readOnly ?? false;
    const changed = readOnly !== this._readOnly;

    this._readOnly = readOnly;
    this.toggleAttribute('data-readonly', readOnly);

    if (this._$editor) {
      this._$editor.contentEditable = readOnly ? 'false' : 'true';

      if (readOnly) {
        this._$editor.setAttribute('aria-readonly', 'true');
        this._$editor.tabIndex = 0;
      } else {
        this._$editor.removeAttribute('aria-readonly');
        this._$editor.removeAttribute('tabindex');
      }
    }

    if (changed) {
      // The plugin transform hook only applies while read-only.
      this._scheduleRender();
    }

    if (this._$editor && resolveFlow(this._$editor).block !== this._gutterBlockAxis) {
      this._syncGutterHeights();
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
            contenteditable=${this._readOnly ? 'false' : 'true'}
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

  protected _onSlotChange(): void {
    this._textareaController.sync();
  }

  protected _setupTextarea(
    $textarea: HTMLTextAreaElement | null,
    $previousTextarea?: HTMLTextAreaElement | null,
  ): void {
    if ($previousTextarea && $previousTextarea !== $textarea) {
      $previousTextarea.removeEventListener('invalid', this._onTextareaInvalid);
    }

    this._textareaAttributeObserver?.disconnect();

    if (!$textarea) {
      this._$textareaRef = null;
      this._syncReadOnly();

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

    this._observeTextarea($textarea);
    this._syncReadOnly();

    // Sync typography from textarea's computed style to editor
    this._syncTypography($textarea);

    this._scheduleRender();
  }

  protected _onTextareaInvalid = (): void => {
    if (this._$editor) {
      this._$editor.setAttribute('aria-invalid', 'true');
    }
  };

  protected _bindEditorEvents($editor: HTMLElement): void {
    $editor.addEventListener('compositionstart', () => {
      this._composing = true;
    });

    $editor.addEventListener('compositionend', () => {
      this._composing = false;
      this._onInput();
    });

    $editor.addEventListener('beforeinput', this._onBeforeInput);
    $editor.addEventListener('input', this._onInputEvent);
    $editor.addEventListener('keydown', this._onKeyDown);
    $editor.addEventListener('paste', this._onPaste);
    $editor.addEventListener('copy', this._onCopy);
    $editor.addEventListener('cut', this._onCopy);

    $editor.addEventListener('focus', () => {
      this.dispatchEvent(
        new CustomEvent('rc-textarea-focus', {
          bubbles: true,
          composed: true,
        }),
      );
    });

    $editor.addEventListener('blur', () => {
      this._tabMovesFocus = false;

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

  protected _onInputEvent = (): void => {
    if (!this._composing) {
      this._onInput();
    }
  };

  protected _onBeforeInput = (event: InputEvent): void => {
    if (this.readOnly || this._isWidgetEvent(event)) {
      return;
    }

    if (this._revealFoldForEdit(event.inputType)) {
      event.preventDefault();

      return;
    }

    // Virtual keyboards may emit no keydown. Keep their browser-generated
    // blocks out of the component's model-owned `.line` document as well.
    if (
      !this._composing &&
      !event.isComposing &&
      (event.inputType === 'insertParagraph' || event.inputType === 'insertLineBreak')
    ) {
      event.preventDefault();
      this._insertText('\n');
    }
  };

  protected _revealFoldAtOffset(offset: number): boolean {
    for (const fold of this._foldBounds) {
      if (offset >= fold.from && offset <= fold.to) {
        fold.reveal();

        return true;
      }
    }

    return false;
  }

  protected _revealFoldForEdit(inputType: string): boolean {
    if (!this._$editor) {
      return false;
    }

    const selection = saveSelection(this._$editor) ?? this._savedSelection;

    if (!selection) {
      return false;
    }

    const start = Math.min(selection.anchorOffset, selection.focusOffset);
    const end = Math.max(selection.anchorOffset, selection.focusOffset);

    for (const fold of this._foldBounds) {
      const intersects = start < fold.to && end > fold.from;
      const entersHiddenLine = start === end && start >= fold.from && start <= fold.to;
      const deletesIntoFold =
        start === end &&
        ((inputType.endsWith('Forward') && start === fold.anchorEnd) ||
          (inputType.endsWith('Backward') && start === fold.to + 1));
      const insertsLineIntoFold =
        start === end &&
        start === fold.anchorEnd &&
        (inputType === 'insertParagraph' ||
          inputType === 'insertLineBreak' ||
          inputType === 'insertFromPaste');

      if (intersects || entersHiddenLine || deletesIntoFold || insertsLineIntoFold) {
        fold.reveal();

        return true;
      }
    }

    return false;
  }

  protected _onInput(): void {
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

  protected _onSelectionChange = (): void => {
    if (!this._$editor) {
      return;
    }

    const selection = saveSelection(this._$editor);

    if (selection) {
      this._savedSelection = selection;

      if (
        selection.anchorOffset === selection.focusOffset &&
        this._revealFoldAtOffset(selection.focusOffset)
      ) {
        return;
      }

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

  protected _updateActiveLine(): void {
    if (!this._$editor) {
      return;
    }

    let $line: HTMLElement | null = null;
    let $node = getSelectionFocusNode(this._$editor);

    while ($node && $node !== this._$editor) {
      if ($node instanceof HTMLElement && $node.classList.contains('line')) {
        $line = $node;

        break;
      }

      $node = $node.parentNode;
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

  protected _updateActiveGutterCell(): void {
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

  protected _onKeyDown = (e: KeyboardEvent): void => {
    if (this.readOnly || this._isWidgetEvent(e)) {
      return;
    }

    // Native contenteditable line breaks do not reliably retain `.line`, so
    // apply physical-keyboard Enter through the plain-text model first.
    if (e.key === 'Enter' && !this._composing && !e.isComposing) {
      e.preventDefault();

      if (this._revealFoldForEdit('insertParagraph')) {
        return;
      }

      this._insertText('\n');

      return;
    }

    // Tab inserts a tab character, so the editor must offer a way out
    // (WCAG 2.1.2): Escape releases the next Tab to move focus, as in
    // CodeMirror, and Shift+Tab always moves focus back.
    if (e.key === 'Escape') {
      this._tabMovesFocus = true;

      return;
    }

    const tabMovesFocus = this._tabMovesFocus;

    this._tabMovesFocus = false;

    if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) {
      if (tabMovesFocus || this._$editor?.querySelector('.widget:not([aria-hidden])')) {
        return;
      }

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

  protected _isWidgetEvent(event: Event): boolean {
    return event
      .composedPath()
      .some(($node) => $node instanceof HTMLElement && $node.classList.contains('widget'));
  }

  protected _insertText(text: string): void {
    if (!this._$editor) {
      return;
    }

    // Native multiline insertion and empty replacement can leave browser-owned
    // blocks or placeholder breaks. Apply these edits directly to the text model.
    if (text.includes('\n') || text === '') {
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

  protected _onCopy = (event: ClipboardEvent): void => {
    if (
      !this._$editor ||
      this._isWidgetEvent(event) ||
      !event.clipboardData ||
      (!this._$editor.querySelector('.widget') && this._foldedRanges.length === 0)
    ) {
      return;
    }

    const selection = saveSelection(this._$editor);

    if (!selection || selection.anchorOffset === selection.focusOffset) {
      return;
    }

    const from = Math.min(selection.anchorOffset, selection.focusOffset);
    const to = Math.max(selection.anchorOffset, selection.focusOffset);

    event.clipboardData.setData('text/plain', getText(this._$editor).slice(from, to));
    event.preventDefault();

    if (event.type === 'cut' && !this.readOnly) {
      this._insertText('');
    }
  };

  protected _onPaste = (e: ClipboardEvent): void => {
    if (this.readOnly || this._isWidgetEvent(e)) {
      return;
    }

    e.preventDefault();

    if (this._revealFoldForEdit('insertFromPaste')) {
      return;
    }

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

  protected _undo(): void {
    if (this._undoIndex <= 0) {
      return;
    }

    this._undoIndex--;
    this._applyUndoEntry(this._undoStack[this._undoIndex]!);
  }

  protected _redo(): void {
    if (this._undoIndex >= this._undoStack.length - 1) {
      return;
    }

    this._undoIndex++;
    this._applyUndoEntry(this._undoStack[this._undoIndex]!);
  }

  protected _applyUndoEntry(entry: UndoEntry): void {
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
  protected _buildPluginApi(): RCTextareaPluginAPI {
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

  protected _clearPluginSheets(): void {
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
   *
   * @example
   * const id = editor.addPattern({ pattern: /TODO/g, className: 'highlight-todo' });
   * // Later:
   * editor.removePattern(id);
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

  protected async _performRender(): Promise<void> {
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

      this._foldedRanges = allDecorations.filter(
        (decoration): decoration is FoldDecoration => decoration.type === 'fold',
      );

      this._foldBounds = getFoldBounds(renderValue, this._foldedRanges);

      this._hiddenGutterLines = new Set(
        this._foldedRanges.flatMap((fold) =>
          Array.from(
            { length: Math.max(0, fold.toLine - fold.fromLine + 1) },
            (_, index) => fold.fromLine + index,
          ),
        ),
      );

      // Rebuild the Parchment tree
      if (!this._$editor) {
        return;
      }

      const $focusedWidget = this.shadowRoot?.activeElement;
      // A presentation refresh may run before selectionchange updates the saved
      // offsets. Preserve the live range unless a source edit has queued a new caret.
      let selectionToRestore =
        getText(this._$editor) === renderValue
          ? (saveSelection(this._$editor) ?? this._savedSelection)
          : this._savedSelection;

      if (selectionToRestore?.anchorOffset === selectionToRestore?.focusOffset) {
        const focusOffset = selectionToRestore?.focusOffset;
        const hidden = this._foldBounds.filter(
          (fold) => focusOffset !== undefined && focusOffset >= fold.from && focusOffset <= fold.to,
        );

        if (hidden.length > 0) {
          const anchorEnd = Math.min(...hidden.map((fold) => fold.anchorEnd));

          selectionToRestore = { anchorOffset: anchorEnd, focusOffset: anchorEnd };
          this._savedSelection = selectionToRestore;
        }
      }

      this._document.build(renderValue, allDecorations);

      if (
        $focusedWidget instanceof HTMLElement &&
        $focusedWidget !== this._$editor &&
        $focusedWidget.isConnected &&
        this.shadowRoot?.activeElement !== $focusedWidget
      ) {
        $focusedWidget.focus({ preventScroll: true });
      }

      // Restore cursor
      if (selectionToRestore && this.shadowRoot?.activeElement === this._$editor) {
        restoreSelection(this._$editor, selectionToRestore);
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
   * mode (`lineNumbers`, `gutter`) and any
   * `LineDecoration.gutterContent` overrides in `allDecorations`.
   *
   * Returns one entry per line (same length as `value.split('\n')`):
   * - `string` — the label to display
   * - `null`   — render an empty cell
   */
  protected _computeGutterLabels(
    allDecorations: Decoration[],
    value = this._value,
  ): (string | HTMLElement | null | { number: string; content: string | HTMLElement })[] {
    const lines = value.split('\n');

    const overrides = new Map<number, string | HTMLElement | null>();

    const accessibleLines = new Set<number>();
    const numberedOverrides = new Set<number>();

    for (const dec of allDecorations) {
      if (dec.type === 'line' && dec.gutterContent !== undefined) {
        overrides.set(dec.line, dec.gutterContent);

        if (dec.gutterAccessible) {
          accessibleLines.add(dec.line);
        } else {
          accessibleLines.delete(dec.line);
        }

        if (dec.gutterLineNumber) {
          numberedOverrides.add(dec.line);
        } else {
          numberedOverrides.delete(dec.line);
        }
      }
    }

    this._accessibleGutterLines = accessibleLines;

    return lines.map((_, i) => {
      const lineNum = i + 1;

      if (overrides.has(lineNum)) {
        const content = overrides.get(lineNum)!;

        if (this.lineNumbers && numberedOverrides.has(lineNum) && content !== null) {
          return { number: String(lineNum), content };
        }

        return content;
      }

      if (this.lineNumbers) {
        return String(lineNum);
      }

      // `gutter` mode is empty by default, and plugins fill via overrides.
      return null;
    });
  }

  /**
   * Synchronize the block size of each gutter cell to match the
   * corresponding `.line` element in the editor.
   *
   * In non-word-wrap mode without block widgets the gutter uses a uniform
   * line height. Wrapped lines and block widgets use per-line heights instead.
   * Also copies the editor's computed block padding to the
   * gutter to compensate for browser UA overrides on contenteditable.
   */
  protected _syncGutterHeights(): void {
    if (!this._$gutterCells || !this._$editor) {
      return;
    }

    // Sync block padding from the editor's computed values.
    // Browser UA overrides (Chrome/Firefox on contenteditable) cause 0.5em to
    // resolve to different pixel values on the gutter vs the editor, producing
    // a constant vertical offset.
    const computedStyle = getComputedStyle(this._$editor);
    const paddingBlockStart = computedStyle.paddingBlockStart;
    const paddingBlockEnd = computedStyle.paddingBlockEnd;

    if (this._$gutterCells.style.paddingBlockStart !== paddingBlockStart) {
      this._$gutterCells.style.paddingBlockStart = paddingBlockStart;
    }

    if (this._$gutterCells.style.paddingBlockEnd !== paddingBlockEnd) {
      this._$gutterCells.style.paddingBlockEnd = paddingBlockEnd;
    }

    const $lineEls = this._$editor.querySelectorAll<HTMLElement>('.line');
    const $spans = this._$gutterCells.children;
    const flow = resolveFlow(this._$editor);
    const editorRect = this._$editor.getBoundingClientRect();
    const gutterZoom = cssZoom(this._$gutterCells);

    this._gutterBlockAxis = flow.block;

    if (!this.wordWrap && !this._$editor.querySelector('.widget--block')) {
      // Chrome UA overrides line-height on contenteditable (even via var() fallback,
      // but not inline styles), giving the editor a different natural cell height
      // than the gutter's CSS 1.5× value. Mirror the first line's actual block size.
      if ($lineEls.length > 0) {
        const lineHeightViewportPx = logicalRect(
          $lineEls[0].getBoundingClientRect(),
          editorRect,
          flow,
        ).blockSize;
        const lineHeight = `${lineHeightViewportPx / gutterZoom}px`;

        if (this._$gutterCells.style.lineHeight !== lineHeight) {
          this._$gutterCells.style.lineHeight = lineHeight;
        }
      }

      for (let i = 0; i < $spans.length; i++) {
        ($spans[i] as HTMLElement).style.blockSize = '';
      }

      return;
    }

    // word-wrap: per-span explicit block sizes drive alignment; clear any forced line-height.
    if (this._$gutterCells.style.lineHeight) {
      this._$gutterCells.style.lineHeight = '';
    }

    for (let i = 0; i < $lineEls.length && i < $spans.length; i++) {
      const blockSizeViewportPx = logicalRect(
        $lineEls[i]!.getBoundingClientRect(),
        editorRect,
        flow,
      ).blockSize;
      const blockSizeStyle = `${blockSizeViewportPx / gutterZoom}px`;
      const $span = $spans[i] as HTMLElement;

      if ($span.style.blockSize !== blockSizeStyle) {
        $span.style.blockSize = blockSizeStyle;
      }
    }
  }

  /**
   * Add, remove, or update `.gutter-cell` spans so their count and text
   * content match `labels`. When `labels` is provided the cached
   * `_gutterLabels` is updated first; otherwise the cached labels are reused
   * (called by the `ResizeObserver` without a new render pass).
   */
  protected _syncGutter(
    labels?: (string | HTMLElement | null | { number: string; content: string | HTMLElement })[],
  ): void {
    if (!this.lineNumbers && !this.gutter) {
      return;
    }

    if (!this._$gutterCells) {
      return;
    }

    if (labels !== undefined) {
      this._gutterLabels = labels;
    }

    const current = this._gutterLabels;

    const $gutter = this._$gutterCells.parentElement;

    if (this._accessibleGutterLines.size > 0) {
      $gutter?.removeAttribute('aria-hidden');
    } else {
      $gutter?.setAttribute('aria-hidden', 'true');
    }

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

      $span.setAttribute('aria-hidden', String(!this._accessibleGutterLines.has(i + 1)));
      $span.hidden = this._hiddenGutterLines.has(i + 1);

      if (typeof label === 'object' && label !== null && !(label instanceof HTMLElement)) {
        let $row = $span.firstElementChild;

        if (!$row?.classList.contains('gutter-cell-composite')) {
          $row = document.createElement('span');

          $row.className = 'gutter-cell-composite';

          const $number = document.createElement('span');

          $number.className = 'gutter-cell-number';

          const $content = document.createElement('span');

          $content.className = 'gutter-cell-content';

          $row.append($number, $content);
          $span.replaceChildren($row);
        }

        const $number = $row.firstElementChild!;
        const $content = $row.lastElementChild!;

        if ($number.textContent !== label.number) {
          $number.textContent = label.number;
        }

        if (label.content instanceof HTMLElement) {
          if ($content.firstChild !== label.content) {
            $content.replaceChildren(label.content);
          }
        } else if ($content.textContent !== label.content || $content.firstElementChild) {
          $content.textContent = label.content;
        }
      } else if (label instanceof HTMLElement) {
        if ($span.firstChild !== label) {
          $span.replaceChildren(label);
        }
      } else if ($span.textContent !== label || $span.firstElementChild) {
        $span.textContent = label;
      }
    }
  }

  protected _syncLabel(): void {
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

    this._$editor.removeAttribute('aria-label');
  }

  protected _syncTypography($textarea: HTMLTextAreaElement): void {
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
