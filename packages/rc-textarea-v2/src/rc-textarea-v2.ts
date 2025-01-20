import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';

import { styles } from './rc-textarea-v2.styles.ts';
import { V2Document, extractEditorText } from './document.ts';
import { saveSelection, restoreSelection, type SavedSelection } from './selection.ts';
import {
  mapOrClear,
  addDecoration,
  setDecorations,
} from './decoration.ts';
import { matchPatternResults } from './pattern-matcher.ts';
import type {
  Decoration,
  DecorationInput,
  RCTextareaV2Plugin,
  RCTextareaV2PluginAPI,
  TextPattern,
  MarkDecoration,
} from './types.ts';
import { generateId } from './types.ts';

// ── Undo entry ────────────────────────────────────────────────────────────────

interface UndoEntry {
  value: string;
  anchorOffset: number;
  focusOffset: number;
}

const MAX_UNDO = 100;

// ── decorationsFromHtml utility ───────────────────────────────────────────────

function decorationsFromHtml(html: string): Omit<MarkDecoration, 'id'>[] {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;

  const result: Omit<MarkDecoration, 'id'>[] = [];
  let charOffset = 0;

  function walk(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      charOffset += (node as Text).length;
      return;
    }
    if (!(node instanceof HTMLElement)) return;

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

  for (const child of tmp.childNodes) walk(child);
  return result;
}

// ── RCTextareaV2 ─────────────────────────────────────────────────────────────

export class RCTextareaV2 extends LitElement {
  static override styles = styles;
  static override shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  // ── Observed properties ───────────────────────────────────────────────

  @property({ type: Boolean, attribute: 'line-numbers', reflect: true })
  lineNumbers = false;

  @property({ type: Boolean, attribute: 'word-wrap', reflect: true })
  wordWrap = false;

  @property({ type: Boolean, attribute: 'auto-grow', reflect: true })
  autoGrow = false;

  @property({ type: Boolean, attribute: 'read-only', reflect: true })
  readOnly = false;

  @property({ type: String })
  label: string | null = null;

  // ── Internal state ────────────────────────────────────────────────────

  private _value = '';
  private _document: V2Document | null = null;
  private _textareaRef: WeakRef<HTMLTextAreaElement> | null = null;

  /** Plugin-owned decorations (set via PluginAPI.setDecorations / addDecoration). */
  private _pluginDecorations = new Map<string, Decoration>();
  /** Pattern-generated decorations (rebuilt on each value change). */
  private _patternDecorations: Decoration[] = [];
  /** Registered patterns. */
  private _patterns = new Map<string, TextPattern>();

  private _plugin: RCTextareaV2Plugin | null = null;
  private _pluginApi: RCTextareaV2PluginAPI | null = null;
  /** Sequence counter for async plugin safety (discard stale results). */
  private _pluginSeq = 0;

  private _savedSelection: SavedSelection | null = null;
  private _rafHandle: number | null = null;
  private _composing = false;
  private _isRendering = false;

  /** Undo/redo stack — necessary because DOM rebuilds invalidate browser's native undo. */
  private _undoStack: UndoEntry[] = [];
  private _undoIndex = -1;

  private _resizeObserver: ResizeObserver | null = null;

  // ── Public value property ─────────────────────────────────────────────

  get value(): string {
    return this._value;
  }

  set value(v: string) {
    if (v === this._value) return;
    this._value = v;
    this._syncTextareaValue();
    this._scheduleRender();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────

  override connectedCallback(): void {
    super.connectedCallback();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._plugin?.destroy?.();
    this._plugin = null;
    this._pluginApi = null;
    this._resizeObserver?.disconnect();
    if (this._rafHandle !== null) {
      cancelAnimationFrame(this._rafHandle);
      this._rafHandle = null;
    }
  }

  override firstUpdated(): void {
    const editorEl = this._getEditorEl();
    if (editorEl) {
      this._document = new V2Document(editorEl as HTMLDivElement);
      this._bindEditorEvents(editorEl);
    }
    this._resizeObserver = new ResizeObserver(() => this._syncGutter());
    this._resizeObserver.observe(this);
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('readOnly')) {
      const editorEl = this._getEditorEl();
      if (editorEl) editorEl.contentEditable = this.readOnly ? 'false' : 'true';
    }
    if (changed.has('label')) {
      const editorEl = this._getEditorEl();
      if (editorEl && this.label) editorEl.setAttribute('aria-label', this.label);
    }
  }

  // ── Template ──────────────────────────────────────────────────────────

  override render() {
    return html`
      <div id="root" part="root">
        <div id="gutter" part="gutter" aria-hidden="true">
          <div id="line-numbers" part="line-numbers"></div>
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
            aria-label=${this.label ?? ''}
          ></div>
          <slot @slotchange=${this._onSlotChange}></slot>
        </div>
      </div>
    `;
  }

  // ── Slot change — lightDOM textarea wiring ────────────────────────────

  private _onSlotChange(): void {
    const slot = this.shadowRoot?.querySelector('slot') as HTMLSlotElement | null;
    if (!slot) return;

    const textarea = slot
      .assignedElements({ flatten: true })
      .find((el): el is HTMLTextAreaElement => el instanceof HTMLTextAreaElement);

    if (!textarea) return;
    this._textareaRef = new WeakRef(textarea);

    // Visually hide — keep in DOM for form submission
    Object.assign(textarea.style, {
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
    textarea.setAttribute('aria-hidden', 'true');
    textarea.tabIndex = -1;

    // Sync attributes from textarea → editor ARIA / state
    const editorEl = this._getEditorEl();
    if (editorEl) {
      if (!this.label && textarea.getAttribute('aria-label')) {
        editorEl.setAttribute('aria-label', textarea.getAttribute('aria-label')!);
      }
      const placeholder = textarea.getAttribute('placeholder');
      if (placeholder) editorEl.setAttribute('aria-placeholder', placeholder);
    }

    // Adopt initial value from textarea
    if (textarea.value && !this._value) {
      this._value = textarea.value;
    }

    // Wire up form validation feedback
    textarea.addEventListener('invalid', () => {
      const editorEl = this._getEditorEl();
      if (editorEl) editorEl.setAttribute('aria-invalid', 'true');
    });

    // Sync typography from textarea's computed style to editor
    this._syncTypography(textarea);

    this._scheduleRender();
  }

  // ── Editor event binding ──────────────────────────────────────────────

  private _bindEditorEvents(editorEl: HTMLElement): void {
    editorEl.addEventListener('beforeinput', this._onBeforeInput);
    editorEl.addEventListener('compositionstart', () => { this._composing = true; });
    editorEl.addEventListener('compositionend', () => {
      this._composing = false;
      this._onInput();
    });
    editorEl.addEventListener('input', this._onInputEvent);
    editorEl.addEventListener('keydown', this._onKeyDown);
    editorEl.addEventListener('paste', this._onPaste);
    editorEl.addEventListener('focus', () => {
      this.dispatchEvent(new CustomEvent('rc-textarea-v2-focus', { bubbles: true, composed: true }));
    });
    editorEl.addEventListener('blur', () => {
      this.dispatchEvent(new CustomEvent('rc-textarea-v2-blur', { bubbles: true, composed: true }));
    });
    editorEl.addEventListener('mouseup', this._onSelectionChange);
    editorEl.addEventListener('keyup', this._onSelectionChange);
  }

  private _onBeforeInput = (): void => {
    const editorEl = this._getEditorEl();
    if (editorEl) this._savedSelection = saveSelection(editorEl);
  };

  private _onInputEvent = (): void => {
    if (!this._composing) this._onInput();
  };

  private _onInput(): void {
    const editorEl = this._getEditorEl();
    if (!editorEl) return;

    const newValue = extractEditorText(editorEl);
    if (newValue === this._value) return;

    const oldValue = this._value;

    // Map existing plugin decorations through the text change
    const mappedDecs = mapOrClear([...this._pluginDecorations.values()], oldValue, newValue);
    this._pluginDecorations.clear();
    for (const dec of mappedDecs) this._pluginDecorations.set(dec.id, dec);

    this._value = newValue;
    this._syncTextareaValue();

    // Push to undo stack
    this._pushUndo(this._savedSelection);

    this.dispatchEvent(
      new CustomEvent('rc-textarea-v2-change', {
        bubbles: true,
        composed: true,
        detail: { value: newValue },
      }),
    );

    this._scheduleRender();
  }

  private _onSelectionChange = (): void => {
    const editorEl = this._getEditorEl();
    if (!editorEl) return;
    const sel = saveSelection(editorEl);
    if (sel) {
      this.dispatchEvent(
        new CustomEvent('rc-textarea-v2-select', {
          bubbles: true,
          composed: true,
          detail: { selectionStart: sel.anchorOffset, selectionEnd: sel.focusOffset },
        }),
      );
    }
  };

  // ── Keyboard handling ─────────────────────────────────────────────────

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

  private _insertText(text: string): void {
    const editorEl = this._getEditorEl();
    if (!editorEl) return;
    this._savedSelection = saveSelection(editorEl);
    // Use execCommand for simple insertions — maintains a minimal undo step
    // until our full rebuild fires on the next RAF.
    document.execCommand('insertText', false, text);
    this._onInput();
  }

  // ── Paste handling ────────────────────────────────────────────────────

  private _onPaste = (e: ClipboardEvent): void => {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') ?? '';
    if (!text) return;
    // Normalize line endings
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    this._insertText(normalized);
  };

  // ── Undo/Redo ─────────────────────────────────────────────────────────

  private _pushUndo(sel: SavedSelection | null): void {
    const entry: UndoEntry = {
      value: this._value,
      anchorOffset: sel?.anchorOffset ?? 0,
      focusOffset: sel?.focusOffset ?? 0,
    };
    // Truncate redo branch
    this._undoStack = this._undoStack.slice(0, this._undoIndex + 1);
    this._undoStack.push(entry);
    if (this._undoStack.length > MAX_UNDO) this._undoStack.shift();
    this._undoIndex = this._undoStack.length - 1;
  }

  private _undo(): void {
    if (this._undoIndex <= 0) return;
    this._undoIndex--;
    this._applyUndoEntry(this._undoStack[this._undoIndex]!);
  }

  private _redo(): void {
    if (this._undoIndex >= this._undoStack.length - 1) return;
    this._undoIndex++;
    this._applyUndoEntry(this._undoStack[this._undoIndex]!);
  }

  private _applyUndoEntry(entry: UndoEntry): void {
    this._value = entry.value;
    this._savedSelection = { anchorOffset: entry.anchorOffset, focusOffset: entry.focusOffset };
    this._syncTextareaValue();
    this.dispatchEvent(
      new CustomEvent('rc-textarea-v2-change', {
        bubbles: true,
        composed: true,
        detail: { value: this._value },
      }),
    );
    this._scheduleRender();
  }

  // ── Plugin API ────────────────────────────────────────────────────────

  usePlugin(plugin: RCTextareaV2Plugin): void {
    this._plugin?.destroy?.();
    this._pluginDecorations.clear();
    this._pluginSeq++;

    this._plugin = plugin;
    this._pluginApi = this._buildPluginApi();
    plugin.mount?.(this._pluginApi);

    this._scheduleRender();
  }

  removePlugin(): void {
    this._plugin?.destroy?.();
    this._plugin = null;
    this._pluginApi = null;
    this._pluginDecorations.clear();
    this._pluginSeq++;
    this._scheduleRender();
  }

  private _buildPluginApi(): RCTextareaV2PluginAPI {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const component = this;
    return {
      get host() { return component; },
      get value() { return component._value; },

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
      scheduleUpdate(): void {
        if (!component._isRendering) component._scheduleRender();
      },
      decorationsFromHtml(html: string): Omit<MarkDecoration, 'id'>[] {
        return decorationsFromHtml(html);
      },
    };
  }

  // ── Pattern API ───────────────────────────────────────────────────────

  addPattern(pattern: Omit<TextPattern, 'id'>): string {
    const id = generateId();
    this._patterns.set(id, { ...pattern, id });
    this._scheduleRender();
    return id;
  }

  removePattern(id: string): void {
    this._patterns.delete(id);
    this._scheduleRender();
  }

  clearPatterns(): void {
    this._patterns.clear();
    this._scheduleRender();
  }

  // ── Render pipeline ───────────────────────────────────────────────────

  private _scheduleRender(): void {
    if (this._rafHandle !== null) return;
    this._rafHandle = requestAnimationFrame(() => {
      this._rafHandle = null;
      void this._performRender();
    });
  }

  private async _performRender(): Promise<void> {
    if (!this._document) return;

    this._isRendering = true;
    const seq = ++this._pluginSeq;

    try {
      // Run pattern matcher
      const { markDecorations: patMarkDecs, lineDecorations: patLineDecs } =
        matchPatternResults(this._value, [...this._patterns.values()]);
      this._patternDecorations = [
        ...patMarkDecs.map(d => ({ ...d, id: generateId() })),
        ...patLineDecs.map(d => ({ ...d, id: generateId() })),
      ];

      // Run plugin (update + highlight)
      if (this._plugin && this._pluginApi) {
        const api = this._pluginApi;

        if (this._plugin.update) {
          await this._plugin.update(this._value, api);
          if (seq !== this._pluginSeq) return; // stale — newer render started
        }

        if (this._plugin.highlight) {
          const html = await this._plugin.highlight(this._value, api);
          if (seq !== this._pluginSeq) return;
          if (typeof html === 'string') {
            const decs = decorationsFromHtml(html);
            // Add parsed decorations on top of existing plugin decorations
            for (const d of decs) {
              addDecoration(this._pluginDecorations, d);
            }
          }
        }
      }

      // Merge all decoration sources
      const allDecorations: Decoration[] = [
        ...this._pluginDecorations.values(),
        ...this._patternDecorations,
      ];

      // Rebuild the Parchment tree
      const editorEl = this._getEditorEl();
      if (!editorEl) return;

      this._document.build(this._value, allDecorations);

      // Restore cursor
      if (this._savedSelection) {
        restoreSelection(editorEl, this._savedSelection);
      }

      // Update gutter
      this._syncGutter();
    } finally {
      this._isRendering = false;
    }
  }

  // ── Gutter ────────────────────────────────────────────────────────────

  private _syncGutter(): void {
    if (!this.lineNumbers) return;
    const gutterEl = this.shadowRoot?.getElementById('line-numbers');
    if (!gutterEl) return;

    const lineCount = this._value.split('\n').length;
    const existing = gutterEl.children.length;

    if (existing === lineCount) return; // nothing to do

    if (lineCount > existing) {
      for (let i = existing + 1; i <= lineCount; i++) {
        const span = document.createElement('span');
        span.className = 'line-number';
        span.textContent = String(i);
        gutterEl.appendChild(span);
      }
    } else {
      while (gutterEl.children.length > lineCount) {
        gutterEl.removeChild(gutterEl.lastChild!);
      }
    }
  }

  // ── Typography sync ───────────────────────────────────────────────────

  private _syncTypography(textarea: HTMLTextAreaElement): void {
    const editorEl = this._getEditorEl();
    if (!editorEl) return;

    const cs = window.getComputedStyle(textarea);
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
    const hostCs = window.getComputedStyle(this);
    if (!hostCs.getPropertyValue('--rc-textarea-v2-font-family')) {
      for (const prop of props) {
        const value = cs[prop];
        if (value && typeof value === 'string') {
          (editorEl.style as unknown as Record<string, string>)[prop as string] = value;
        }
      }
    }
  }

  // ── Form integration ──────────────────────────────────────────────────

  private _syncTextareaValue(): void {
    const textarea = this._textareaRef?.deref();
    if (textarea) textarea.value = this._value;
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private _getEditorEl(): HTMLElement | null {
    return this.shadowRoot?.getElementById('editor') as HTMLElement | null;
  }
}

customElements.define('rc-textarea-v2', RCTextareaV2);

declare global {
  interface HTMLElementTagNameMap {
    'rc-textarea-v2': RCTextareaV2;
  }
}
