import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import {
  type Decoration,
  type DecorationInput,
  type MarkDecoration,
  type LineDecoration,
  type Diagnostic,
  type WidgetDecoration,
  generateId,
  mapDecorationsThroughChange,
  isLargeChange,
  findEdit,
} from './decoration.ts';
import { type TextPattern, matchPatternResults } from './pattern-matcher.ts';
import { renderEditor, renderLineOverlay, renderGutter, escapeHtml, extractEditorText } from './renderer.ts';
import { saveSelection, restoreSelection, setEditorOffset } from './selection.ts';
import textareaStyles from './rc-textarea.styles.ts';
import type { RCTextareaPlugin, RCTextareaPluginAPI } from './plugin.ts';

declare global {
  interface HTMLElementTagNameMap {
    'rc-textarea': RCTextarea;
  }
}

/**
 * An enhanced textarea component using a `contenteditable` editing surface.
 *
 * The contenteditable div is kept clean — it receives only flat inline HTML
 * (plain text + mark/widget spans, or plugin output like hljs/Prism). All
 * line-level visuals (highlights, diagnostics, line numbers) are rendered in
 * a separate `#line-overlay` div that is absolutely positioned behind the
 * editor and scroll-synced via CSS transform.
 *
 * The light-DOM `<textarea>` is kept hidden for progressive enhancement and
 * form-submission fallback; primary form association uses `ElementInternals`.
 *
 * @slot - The native `<textarea>` element to enhance. Its initial `value` is
 *   used as the editor's starting content. Kept hidden in DOM for form fallback.
 *
 * @attr {boolean} line-numbers - Show line number gutter
 * @attr {boolean} word-wrap    - Enable word wrap
 * @attr {boolean} auto-grow   - Grow to fit content instead of scrolling
 * @attr {boolean} read-only   - Make the editor read-only
 * @attr {string}  label       - Sets aria-label on the editor
 *
 * @csspart root              - Outer flex container
 * @csspart gutter            - Line number gutter
 * @csspart line-numbers      - Line number elements container
 * @csspart editor-area       - Editor area (overlay + contenteditable)
 * @csspart line-overlay      - Absolutely-positioned line decoration/diagnostic overlay
 * @csspart editor            - The contenteditable editing surface
 * @csspart diagnostic-status - ARIA live region for diagnostics
 *
 * @cssprop --rc-textarea-font-family
 * @cssprop --rc-textarea-font-size
 * @cssprop --rc-textarea-line-height
 * @cssprop --rc-textarea-padding
 * @cssprop --rc-textarea-gutter-color
 * @cssprop --rc-textarea-gutter-bg
 * @cssprop --rc-textarea-gutter-border
 * @cssprop --rc-textarea-background
 * @cssprop --rc-textarea-color
 * @cssprop --rc-textarea-caret-color
 * @cssprop --rc-textarea-border
 * @cssprop --rc-textarea-border-radius
 * @cssprop --rc-textarea-focus-outline
 * @cssprop --rc-textarea-mark-error-color
 * @cssprop --rc-textarea-mark-warning-color
 * @cssprop --rc-textarea-mark-info-color
 * @cssprop --rc-textarea-mark-hint-color
 * @cssprop --rc-textarea-mark-diagnostic-color
 *
 * @fires {CustomEvent<{value: string}>} rc-textarea-change
 * @fires {CustomEvent<void>} rc-textarea-focus
 * @fires {CustomEvent<void>} rc-textarea-blur
 * @fires {CustomEvent<{selectionStart: number, selectionEnd: number}>} rc-textarea-select
 */
@customElement('rc-textarea')
export class RCTextarea extends LitElement {
  static styles = [textareaStyles];
  static formAssociated = true;

  @property({ type: Boolean, reflect: true }) lineNumbers = false;
  @property({ type: Boolean, reflect: true }) wordWrap = false;
  @property({ type: Boolean, reflect: true }) autoGrow = false;
  @property({ type: Boolean, reflect: true }) readOnly = false;
  @property({ type: String }) label = '';

  @query('#editor')   private _$editor!: HTMLDivElement;
  @query('#line-overlay') private _$lineOverlay!: HTMLDivElement;
  @query('#line-numbers') private _$lineNumbers!: HTMLDivElement;
  @query('#diagnostic-status') private _$diagnosticStatus!: HTMLDivElement;

  private _internals: ElementInternals;
  private _textareaRef: WeakRef<HTMLTextAreaElement> | null = null;
  private _decorationStyleSheet: CSSStyleSheet | null = null;
  private _decorations: Map<string, Decoration> = new Map();
  private _diagnostics: Map<string, Diagnostic> = new Map();
  private _patterns: Map<string, TextPattern> = new Map();
  private _patternDecorations: MarkDecoration[] = [];
  private _patternDiagnostics: Diagnostic[] = [];
  private _patternStyleSheets: Map<string, CSSStyleSheet> = new Map();
  private _widgets: Map<string, WidgetDecoration> = new Map();
  private _prevValue = '';
  private _rafHandle: number | null = null;
  private _isRendering = false;
  private _composing = false;
  private _adoptedStyleSheets: CSSStyleSheet[] = [];
  private _plugin: RCTextareaPlugin | null = null;
  private _pluginApi: RCTextareaPluginAPI | null = null;
  private _pluginSeq = 0;
  private _resizeObserver = new ResizeObserver(() => this._scheduleUpdate());

  constructor() {
    super();
    this._internals = this.attachInternals();
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  connectedCallback() {
    super.connectedCallback();
    this._resizeObserver.observe(this);
    document.addEventListener('selectionchange', this._onSelectionChange);
  }

  disconnectedCallback() {
    this._resizeObserver.disconnect();
    document.removeEventListener('selectionchange', this._onSelectionChange);
    if (this._rafHandle !== null) {
      cancelAnimationFrame(this._rafHandle);
      this._rafHandle = null;
    }
    this._plugin?.destroy?.();
    super.disconnectedCallback();
  }

  firstUpdated() {
    const textarea = this._textareaRef?.deref();
    const initialValue = textarea?.value ?? '';
    this._prevValue = initialValue;
    this._internals.setFormValue(initialValue);

    ({ decorations: this._patternDecorations, diagnostics: this._patternDiagnostics } =
      matchPatternResults(initialValue, [...this._patterns.values()]));

    this._scheduleUpdate();

    if (this._adoptedStyleSheets.length && this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = [
        ...this.shadowRoot.adoptedStyleSheets,
        ...this._adoptedStyleSheets,
      ];
    }
  }

  protected updated(changedProperties: Map<PropertyKey, unknown>) {
    super.updated(changedProperties);

    if (changedProperties.has('label')) {
      const editor = this._$editor;
      if (editor) {
        if (this.label) editor.setAttribute('aria-label', this.label);
        else editor.removeAttribute('aria-label');
      }
    }

    if (changedProperties.has('readOnly')) {
      const editor = this._$editor;
      if (editor) editor.contentEditable = this.readOnly ? 'false' : 'true';
    }

    if (changedProperties.has('wordWrap') || changedProperties.has('autoGrow')) {
      this._scheduleUpdate();
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  protected render() {
    return html`
      <div id="root" part="root">
        <div id="gutter" part="gutter">
          <div id="line-numbers" part="line-numbers" aria-hidden="true"></div>
        </div>
        <div id="editor-area" part="editor-area">
          <div id="line-overlay" part="line-overlay" aria-hidden="true"></div>
          <div
            id="editor"
            part="editor"
            role="textbox"
            aria-multiline="true"
            contenteditable="true"
            spellcheck="false"
            autocorrect="off"
            autocapitalize="off"
            data-gramm="false"
            data-gramm_editor="false"
            data-enable-grammarly="false"
            @input=${this._onEditorInput}
            @compositionstart=${this._onCompositionStart}
            @compositionend=${this._onCompositionEnd}
            @focus=${this._onFocus}
            @blur=${this._onBlur}
            @keydown=${this._onKeyDown}
            @scroll=${this._onEditorScroll}
          ></div>
          <slot @slotchange=${this._onSlotChange}></slot>
        </div>
      </div>
      <div
        id="diagnostic-status"
        part="diagnostic-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      ></div>
    `;
  }

  // ─── Slot handling ─────────────────────────────────────────────────────────

  private _onSlotChange = (e: Event) => {
    const slot = e.currentTarget as HTMLSlotElement;
    const textarea = slot
      .assignedElements()
      .find((el): el is HTMLTextAreaElement => el instanceof HTMLTextAreaElement);

    if (!textarea) {
      this._textareaRef = null;
      return;
    }

    this._textareaRef = new WeakRef(textarea);
    textarea.setAttribute('aria-hidden', 'true');
    textarea.setAttribute('tabindex', '-1');
    textarea.readOnly = true;

    const initialValue = textarea.value;
    if (initialValue && this._$editor) {
      this._prevValue = initialValue;
      this._internals.setFormValue(initialValue);
      this._scheduleUpdate();
    }

    this._adoptTextareaSize(textarea);
  };

  // ─── Scroll sync ───────────────────────────────────────────────────────────

  private _onEditorScroll = () => {
    const editor = this._$editor;
    if (!editor) return;
    const sx = editor.scrollLeft;
    const sy = editor.scrollTop;
    const overlay = this._$lineOverlay;
    const lineNumbers = this._$lineNumbers;
    if (overlay) overlay.style.transform = `translate(${-sx}px,${-sy}px)`;
    if (lineNumbers) lineNumbers.style.transform = `translateY(${-sy}px)`;
  };

  // ─── Initial size adoption ─────────────────────────────────────────────────

  private _hasAuthorDimension(prop: 'width' | 'height'): boolean {
    if (this.style[prop] !== '') return true;
    type WithTypedOM = { computedStyleMap(): StylePropertyMapReadOnly };
    const el = this as unknown as Partial<WithTypedOM>;
    if (typeof el.computedStyleMap === 'function') {
      const val = el.computedStyleMap().get(prop);
      return val !== null && !(val instanceof CSSKeywordValue && val.value === 'auto');
    }
    return false;
  }

  private _adoptTextareaSize(textarea: HTMLTextAreaElement) {
    if (this._hasAuthorDimension('width') || this._hasAuthorDimension('height')) return;
    if (textarea.style.width) this.style.width = textarea.style.width;
    if (textarea.style.height) this.style.height = textarea.style.height;
    if (this.style.width && this.style.height) return;

    const rows = textarea.getAttribute('rows');
    const cols = textarea.getAttribute('cols');

    if (rows && !this.style.height) {
      const r = parseInt(rows, 10);
      if (r > 0) {
        const calc = `calc(${r} * var(--rc-textarea-line-height, 1.5) * var(--rc-textarea-font-size, 1em) + 2 * var(--rc-textarea-padding, 0.5em))`;
        if (this.autoGrow) {
          if (!this.style.minHeight) this.style.minHeight = calc;
        } else {
          this.style.height = calc;
        }
      }
    }
    if (cols && !this.style.width) {
      const c = parseInt(cols, 10);
      if (c > 0)
        this.style.width = `calc(${c} * 0.6em + 2 * var(--rc-textarea-padding, 0.5em))`;
    }
  }

  // ─── Event handlers ────────────────────────────────────────────────────────

  private _onEditorInput = () => {
    if (this._composing) return;
    const editor = this._$editor;
    if (!editor) return;
    this._handleValueChange(extractEditorText(editor));
  };

  private _onCompositionStart = () => { this._composing = true; };

  private _onCompositionEnd = () => {
    this._composing = false;
    const editor = this._$editor;
    if (editor) this._handleValueChange(extractEditorText(editor));
  };

  private _handleValueChange(newValue: string) {
    const oldValue = this._prevValue;
    const edit = findEdit(oldValue, newValue);

    if (isLargeChange(oldValue, edit)) {
      this._decorations.clear();
      this._diagnostics.clear();
      this._widgets.clear();
    } else {
      const allDecs = [...this._decorations.values(), ...this._widgets.values()];
      const { decorations: mapped, diagnostics: mappedDiags } =
        mapDecorationsThroughChange(allDecs, [...this._diagnostics.values()], oldValue, newValue);
      const mappedWidgets = mapped.filter((d): d is WidgetDecoration => d.type === 'widget');
      const mappedOthers = mapped.filter((d): d is Exclude<Decoration, WidgetDecoration> => d.type !== 'widget');
      this._decorations = new Map(mappedOthers.map((d) => [d.id, d]));
      this._diagnostics = new Map(mappedDiags.map((d) => [d.id, d]));
      this._widgets = new Map(mappedWidgets.map((d) => [d.id, d]));
    }

    this._prevValue = newValue;
    const textarea = this._textareaRef?.deref();
    if (textarea) textarea.value = newValue;
    this._internals.setFormValue(newValue);

    ({ decorations: this._patternDecorations, diagnostics: this._patternDiagnostics } =
      matchPatternResults(newValue, [...this._patterns.values()]));

    this._scheduleUpdate();
    this.dispatchEvent(new CustomEvent<{ value: string }>('rc-textarea-change', {
      bubbles: true, composed: true, detail: { value: newValue },
    }));
    this._updateAriaInvalid();
  }

  private _onKeyDown = (e: KeyboardEvent) => {
    if (this._composing) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (!range.collapsed) range.deleteContents();
      const textNode = document.createTextNode('\n');
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      const editor = this._$editor;
      if (editor) this._handleValueChange(extractEditorText(editor));
    }
  };

  private _onSelectionChange = () => {
    const editor = this._$editor;
    if (!editor) return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    const saved = saveSelection(editor);
    if (!saved) return;
    this.dispatchEvent(new CustomEvent<{ selectionStart: number; selectionEnd: number }>(
      'rc-textarea-select', {
        bubbles: true, composed: true,
        detail: { selectionStart: saved.start, selectionEnd: saved.end },
      },
    ));
  };

  private _onFocus = () =>
    this.dispatchEvent(new CustomEvent('rc-textarea-focus', { bubbles: true, composed: true }));

  private _onBlur = () =>
    this.dispatchEvent(new CustomEvent('rc-textarea-blur', { bubbles: true, composed: true }));

  // ─── Batched rendering ─────────────────────────────────────────────────────

  private _scheduleUpdate() {
    if (this._rafHandle !== null) return;
    this._rafHandle = requestAnimationFrame(() => {
      this._rafHandle = null;
      void this._performUpdate();
    });
  }

  private _deriveDiagnosticMarkDecorations(): MarkDecoration[] {
    const result: MarkDecoration[] = [];
    for (const diag of [...this._diagnostics.values(), ...this._patternDiagnostics]) {
      if (diag.range) {
        result.push({
          id: `diag-mark:${diag.id}`,
          type: 'mark',
          range: diag.range,
          className: diag.markClassName ?? `diagnostic-mark diagnostic-mark--${diag.severity}`,
        });
      }
    }
    return result;
  }

  private _deriveDiagnosticLineDecorations(): LineDecoration[] {
    const result: LineDecoration[] = [];
    for (const diag of [...this._diagnostics.values(), ...this._patternDiagnostics]) {
      if (diag.lineClassName) {
        result.push({
          id: `diag-line:${diag.id}`,
          type: 'line',
          line: diag.line,
          className: diag.lineClassName,
        });
      }
    }
    return result;
  }

  private _measureLineHeights(editor: HTMLElement, value: string): number[] {
    const lines = value.split('\n');
    const cs = getComputedStyle(editor);
    const defaultH = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5;
    const heights: number[] = [];
    let charOffset = 0;

    for (const line of lines) {
      if (line.length === 0) {
        heights.push(defaultH);
      } else {
        const startPos = setEditorOffset(editor, charOffset);
        const endPos = setEditorOffset(editor, charOffset + line.length);
        const range = document.createRange();
        range.setStart(startPos.node, startPos.offset);
        range.setEnd(endPos.node, endPos.offset);
        const rect = range.getBoundingClientRect();
        heights.push(rect.height || defaultH);
      }
      charOffset += line.length + 1;
    }
    return heights;
  }

  private async _performUpdate() {
    if (this._composing) return;
    this._isRendering = true;
    try {
      const editor = this._$editor;
      if (!editor) return;

      const value = this._prevValue;
      const lineCount = value.split('\n').length;
      const allDiagnostics = [...this._diagnostics.values(), ...this._patternDiagnostics];

      // Inline decorations → go into the contenteditable editor
      const inlineDecs: Array<MarkDecoration | WidgetDecoration> = [
        ...[...this._decorations.values()].filter(
          (d): d is MarkDecoration | WidgetDecoration => d.type === 'mark' || d.type === 'widget'
        ),
        ...this._widgets.values(),
        ...this._patternDecorations,
        ...this._deriveDiagnosticMarkDecorations(),
      ];

      // Line decorations → go into the overlay
      const lineDecs: LineDecoration[] = [
        ...[...this._decorations.values()].filter(
          (d): d is LineDecoration => d.type === 'line'
        ),
        ...this._deriveDiagnosticLineDecorations(),
      ];

      // ── Editor HTML ──────────────────────────────────────────────────────
      const saved = saveSelection(editor);

      let editorHtml: string;
      if (this._plugin && this._pluginApi) {
        const seq = ++this._pluginSeq;
        const result = await Promise.resolve(this._plugin.highlight(value, this._pluginApi));
        if (this._pluginSeq !== seq) return;
        editorHtml = result != null ? String(result) : renderEditor(value, inlineDecs);
      } else {
        editorHtml = renderEditor(value, inlineDecs);
      }

      editor.innerHTML = editorHtml;
      if (saved) restoreSelection(editor, saved);

      // ── Line overlay HTML ────────────────────────────────────────────────
      const overlay = this._$lineOverlay;
      if (overlay) {
        overlay.innerHTML = renderLineOverlay(value, lineDecs, allDiagnostics);

        if (this.wordWrap) {
          const heights = this._measureLineHeights(editor, value);
          const rows = overlay.querySelectorAll<HTMLElement>('.overlay-line');
          for (let i = 0; i < rows.length && i < heights.length; i++) {
            rows[i].style.height = `${heights[i]}px`;
          }
        }
      }

      // ── Gutter ──────────────────────────────────────────────────────────
      const lineNumbers = this._$lineNumbers;
      if (lineNumbers) {
        const lineHeights = this.wordWrap
          ? this._measureLineHeights(editor, value)
          : undefined;
        lineNumbers.innerHTML = renderGutter(lineCount, lineHeights);
      }

      this._updateDiagnosticStatus();
    } finally {
      this._isRendering = false;
    }
  }

  private _updateDiagnosticStatus() {
    const el = this._$diagnosticStatus;
    if (!el) return;
    const diags = [...this._diagnostics.values(), ...this._patternDiagnostics];
    if (diags.length === 0) { el.textContent = ''; return; }
    const summary = diags.map((d) => `Line ${d.line} ${d.severity}: ${d.message}`).join('; ');
    el.textContent = `${diags.length} diagnostic${diags.length !== 1 ? 's' : ''}: ${summary}`;
  }

  private _updateAriaInvalid(): void {
    const editor = this._$editor;
    if (!editor) return;
    const hasErrors = [...this._diagnostics.values(), ...this._patternDiagnostics].some(
      (d) => d.severity === 'error',
    );
    if (hasErrors) editor.setAttribute('aria-invalid', 'true');
    else editor.removeAttribute('aria-invalid');
  }

  // ─── Plugin API ────────────────────────────────────────────────────────────

  usePlugin(plugin: RCTextareaPlugin): void {
    this._plugin?.destroy?.();
    this._plugin = plugin;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this._pluginApi = {
      get host() { return self; },
      get editor() { return self._$editor; },
      get diagnostics() {
        return [...self._diagnostics.values(), ...self._patternDiagnostics] as const;
      },
      get decorations() {
        return [...self._decorations.values(), ...self._patternDecorations] as const;
      },
      escapeHtml,
      renderDefault(value: string) {
        const decs: Array<MarkDecoration | WidgetDecoration> = [
          ...[...self._decorations.values()].filter(
            (d): d is MarkDecoration | WidgetDecoration => d.type === 'mark' || d.type === 'widget'
          ),
          ...self._widgets.values(),
          ...self._patternDecorations,
          ...self._deriveDiagnosticMarkDecorations(),
        ];
        return renderEditor(value, decs);
      },
      scheduleUpdate() { self._scheduleUpdate(); },
    };
    plugin.mount?.(this._pluginApi);
    this._scheduleUpdate();
  }

  removePlugin(): void {
    this._plugin?.destroy?.();
    this._plugin = null;
    this._pluginApi = null;
    this._scheduleUpdate();
  }

  // ─── Stylesheet API ────────────────────────────────────────────────────────

  setDecorationStyles(cssText: string): void {
    if (!this.shadowRoot) return;
    if (this._decorationStyleSheet) {
      this._decorationStyleSheet.replaceSync(cssText);
    } else {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(cssText);
      this._decorationStyleSheet = sheet;
      this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, sheet];
    }
  }

  adoptStyleSheet(sheet: CSSStyleSheet): void {
    if (this._adoptedStyleSheets.includes(sheet)) return;
    this._adoptedStyleSheets.push(sheet);
    if (this.shadowRoot)
      this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, sheet];
  }

  removeStyleSheet(sheet: CSSStyleSheet): void {
    const idx = this._adoptedStyleSheets.indexOf(sheet);
    if (idx === -1) return;
    this._adoptedStyleSheets.splice(idx, 1);
    if (this.shadowRoot)
      this.shadowRoot.adoptedStyleSheets = this.shadowRoot.adoptedStyleSheets.filter((s) => s !== sheet);
  }

  // ─── Value API ─────────────────────────────────────────────────────────────

  get value(): string { return this._prevValue; }

  set value(v: string) {
    const oldValue = this._prevValue;
    const edit = findEdit(oldValue, v);
    if (isLargeChange(oldValue, edit)) {
      this._decorations.clear();
      this._diagnostics.clear();
      this._widgets.clear();
    } else {
      const allDecs = [...this._decorations.values(), ...this._widgets.values()];
      const { decorations: mapped, diagnostics: mappedDiags } =
        mapDecorationsThroughChange(allDecs, [...this._diagnostics.values()], oldValue, v);
      const mappedWidgets = mapped.filter((d): d is WidgetDecoration => d.type === 'widget');
      const mappedOthers = mapped.filter((d): d is Exclude<Decoration, WidgetDecoration> => d.type !== 'widget');
      this._decorations = new Map(mappedOthers.map((d) => [d.id, d]));
      this._diagnostics = new Map(mappedDiags.map((d) => [d.id, d]));
      this._widgets = new Map(mappedWidgets.map((d) => [d.id, d]));
    }
    this._prevValue = v;
    const textarea = this._textareaRef?.deref();
    if (textarea) textarea.value = v;
    this._internals.setFormValue(v);
    ({ decorations: this._patternDecorations, diagnostics: this._patternDiagnostics } =
      matchPatternResults(v, [...this._patterns.values()]));
    this._scheduleUpdate();
  }

  // ─── Decoration API ────────────────────────────────────────────────────────

  protected addDecoration(decoration: DecorationInput): string {
    const id = generateId();
    this._decorations.set(id, { ...decoration, id } as Decoration);
    this._scheduleUpdate();
    return id;
  }

  protected removeDecoration(id: string): void {
    this._decorations.delete(id);
    this._scheduleUpdate();
  }

  protected updateDecoration(id: string, patch: Partial<DecorationInput>): void {
    const existing = this._decorations.get(id);
    if (!existing) return;
    this._decorations.set(id, { ...existing, ...patch } as Decoration);
    this._scheduleUpdate();
  }

  protected clearDecorations(): void {
    this._decorations.clear();
    this._scheduleUpdate();
  }

  protected setDecorations(decorations: DecorationInput[]): void {
    this._decorations.clear();
    for (const d of decorations) {
      const id = generateId();
      this._decorations.set(id, { ...d, id } as Decoration);
    }
    this._scheduleUpdate();
  }

  // ─── Widget API ────────────────────────────────────────────────────────────

  addWidget(input: Omit<WidgetDecoration, 'type' | 'id'>): string {
    const id = generateId();
    this._widgets.set(id, { ...input, type: 'widget', id });
    this._scheduleUpdate();
    return id;
  }

  removeWidget(id: string): void {
    this._widgets.delete(id);
    this._scheduleUpdate();
  }

  setWidgets(inputs: Omit<WidgetDecoration, 'type' | 'id'>[]): void {
    this._widgets.clear();
    for (const input of inputs) {
      const id = generateId();
      this._widgets.set(id, { ...input, type: 'widget', id });
    }
    this._scheduleUpdate();
  }

  clearWidgets(): void {
    this._widgets.clear();
    this._scheduleUpdate();
  }

  // ─── Diagnostic API ────────────────────────────────────────────────────────

  addDiagnostic(diagnostic: Omit<Diagnostic, 'id'>): string {
    const id = generateId();
    this._diagnostics.set(id, { ...diagnostic, id });
    if (!this._isRendering) this._scheduleUpdate();
    this._updateDiagnosticStatus();
    this._updateAriaInvalid();
    return id;
  }

  removeDiagnostic(id: string): void {
    this._diagnostics.delete(id);
    if (!this._isRendering) this._scheduleUpdate();
    this._updateDiagnosticStatus();
    this._updateAriaInvalid();
  }

  clearDiagnostics(): void {
    this._diagnostics.clear();
    if (!this._isRendering) this._scheduleUpdate();
    this._updateDiagnosticStatus();
    this._updateAriaInvalid();
  }

  setDiagnostics(diagnostics: Omit<Diagnostic, 'id'>[]): void {
    this._diagnostics.clear();
    for (const d of diagnostics) {
      const id = generateId();
      this._diagnostics.set(id, { ...d, id });
    }
    if (!this._isRendering) this._scheduleUpdate();
    this._updateDiagnosticStatus();
    this._updateAriaInvalid();
  }

  // ─── Pattern API ───────────────────────────────────────────────────────────

  addPattern(pattern: Omit<TextPattern, 'id'>): string {
    const id = generateId();
    this._patterns.set(id, { ...pattern, id });
    if (pattern.cssText && this.shadowRoot) {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(pattern.cssText);
      this._patternStyleSheets.set(id, sheet);
      this.shadowRoot.adoptedStyleSheets = [...this.shadowRoot.adoptedStyleSheets, sheet];
    }
    ({ decorations: this._patternDecorations, diagnostics: this._patternDiagnostics } =
      matchPatternResults(this.value, [...this._patterns.values()]));
    this._scheduleUpdate();
    return id;
  }

  removePattern(id: string): void {
    this._patterns.delete(id);
    const sheet = this._patternStyleSheets.get(id);
    if (sheet && this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = this.shadowRoot.adoptedStyleSheets.filter((s) => s !== sheet);
      this._patternStyleSheets.delete(id);
    }
    ({ decorations: this._patternDecorations, diagnostics: this._patternDiagnostics } =
      matchPatternResults(this.value, [...this._patterns.values()]));
    this._scheduleUpdate();
  }

  clearPatterns(): void {
    if (this.shadowRoot && this._patternStyleSheets.size > 0) {
      const patternSheets = new Set(this._patternStyleSheets.values());
      this.shadowRoot.adoptedStyleSheets = this.shadowRoot.adoptedStyleSheets.filter(
        (s) => !patternSheets.has(s),
      );
    }
    this._patternStyleSheets.clear();
    this._patterns.clear();
    this._patternDecorations = [];
    this._patternDiagnostics = [];
    this._scheduleUpdate();
  }

  // ─── Navigation API ────────────────────────────────────────────────────────

  revealLine(lineNumber: number): void {
    const editor = this._$editor;
    if (!editor) return;
    const cs = getComputedStyle(editor);
    const lhStr = cs.lineHeight;
    const lh = lhStr === 'normal' ? parseFloat(cs.fontSize) * 1.2 : parseFloat(lhStr);
    const paddingTop = parseFloat(cs.paddingTop);
    editor.scrollTop = paddingTop + (lineNumber - 1) * lh;
    this._onEditorScroll();
  }
}
