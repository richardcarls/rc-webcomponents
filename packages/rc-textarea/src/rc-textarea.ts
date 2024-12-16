import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import {
  type Decoration,
  type DecorationInput,
  type MarkDecoration,
  type Diagnostic,
  generateId,
  mapDecorationsThroughChange,
  isLargeChange,
  findEdit,
} from './decoration.ts';
import { type TextPattern, matchPatterns } from './pattern-matcher.ts';
import { renderMirror, renderGutter } from './renderer.ts';
import textareaStyles from './rc-textarea.styles.ts';

declare global {
  interface HTMLElementTagNameMap {
    'rc-textarea': RCTextarea;
  }
}

/**
 * A textarea progressive enhancement component providing line numbers,
 * word wrap, range highlighting, Error Lens-style inline diagnostics,
 * and pattern-based decoration.
 *
 * @slot - The native `<textarea>` element to enhance. The textarea remains
 *   the accessible interaction surface; the component adds a visual layer.
 *
 * @attr {boolean} line-numbers - Show line number gutter
 * @attr {boolean} word-wrap    - Enable word wrap
 * @attr {boolean} auto-grow   - Grow to fit content instead of scrolling
 * @attr {boolean} read-only   - Make the textarea read-only
 * @attr {string}  label       - Sets aria-label on the textarea if not already set
 *
 * @csspart root              - Outer flex container
 * @csspart gutter            - Line number gutter
 * @csspart line-numbers      - Line number elements container
 * @csspart editor-area       - Editor area (mirror + textarea)
 * @csspart mirror            - The decoration mirror div
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
 * @cssprop --rc-textarea-caret-color     - Defaults to --rc-textarea-color (not currentColor, which would be transparent)
 * @cssprop --rc-textarea-border          - Default: 1px solid ButtonBorder
 * @cssprop --rc-textarea-border-radius   - Default: 2px
 * @cssprop --rc-textarea-focus-outline   - Default: 2px solid AccentColor
 * @cssprop --rc-textarea-mark-error-color
 * @cssprop --rc-textarea-mark-warning-color
 * @cssprop --rc-textarea-mark-info-color
 * @cssprop --rc-textarea-mark-hint-color
 *
 * @fires {CustomEvent<{value: string}>} rc-textarea-change
 * @fires {CustomEvent<void>} rc-textarea-focus
 * @fires {CustomEvent<void>} rc-textarea-blur
 * @fires {CustomEvent<{selectionStart: number, selectionEnd: number}>} rc-textarea-select
 */
@customElement('rc-textarea')
export class RCTextarea extends LitElement {
  static styles = [textareaStyles];

  /** Show line number gutter */
  @property({ type: Boolean, reflect: true })
  lineNumbers = false;

  /** Enable word wrap */
  @property({ type: Boolean, reflect: true })
  wordWrap = false;

  /** Grow to fit content (no scroll) */
  @property({ type: Boolean, reflect: true })
  autoGrow = false;

  /** Make the textarea read-only */
  @property({ type: Boolean, reflect: true })
  readOnly = false;

  /**
   * Sets aria-label on the slotted textarea if it does not already have one.
   */
  @property({ type: String })
  label = '';

  @query('#mirror')
  private _$mirror!: HTMLDivElement;

  @query('#line-numbers')
  private _$lineNumbers!: HTMLDivElement;

  @query('#diagnostic-status')
  private _$diagnosticStatus!: HTMLDivElement;

  private _textareaRef: WeakRef<HTMLTextAreaElement> | null = null;
  private _decorationStyleSheet: CSSStyleSheet | null = null;
  private _decorations: Map<string, Decoration> = new Map();
  private _diagnostics: Map<string, Diagnostic> = new Map();
  private _patterns: Map<string, TextPattern> = new Map();
  private _patternDecorations: MarkDecoration[] = [];
  private _prevValue = '';
  private _rafHandle: number | null = null;
  private _intersectionObserver: IntersectionObserver | null = null;
  private _resizeObserver = new ResizeObserver(() => {
    const textarea = this._textareaRef?.deref();
    if (textarea) {
      this._syncTypography(textarea);
      this._scheduleUpdate();
    }
  });

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  connectedCallback() {
    super.connectedCallback();
    this._resizeObserver.observe(this);
    this._intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const textarea = this._textareaRef?.deref();
            if (textarea) {
              this._syncTypography(textarea);
              this._adoptTextareaSize(textarea);
              this._scheduleUpdate();
            }
            break;
          }
        }
      },
      { threshold: 0 },
    );
    this._intersectionObserver.observe(this);
  }

  disconnectedCallback() {
    this._resizeObserver.disconnect();
    this._intersectionObserver?.disconnect();
    this._intersectionObserver = null;
    const textarea = this._textareaRef?.deref();
    if (textarea) {
      this._removeTextareaListeners(textarea);
      this._unlinkDescribedBy(textarea);
    }
    if (this._rafHandle !== null) {
      cancelAnimationFrame(this._rafHandle);
      this._rafHandle = null;
    }
    super.disconnectedCallback();
  }

  firstUpdated() {
    // Shadow DOM is ready; sync typography and render if textarea was already slotted
    const textarea = this._textareaRef?.deref();
    if (textarea) {
      this._syncTypography(textarea);
      this._scheduleUpdate();
    }
  }

  protected updated(changedProperties: Map<PropertyKey, unknown>) {
    super.updated(changedProperties);

    const textarea = this._textareaRef?.deref();

    if (changedProperties.has('label') && textarea) {
      if (this.label && !textarea.hasAttribute('aria-label')) {
        textarea.setAttribute('aria-label', this.label);
      }
    }

    if (changedProperties.has('readOnly') && textarea) {
      textarea.readOnly = this.readOnly;
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
          <div id="mirror" part="mirror" aria-hidden="true"></div>
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

    // Clean up previous textarea
    const oldTextarea = this._textareaRef?.deref();
    if (oldTextarea) {
      this._removeTextareaListeners(oldTextarea);
      this._unlinkDescribedBy(oldTextarea);
    }

    const textarea = slot
      .assignedElements()
      .find((el): el is HTMLTextAreaElement => el instanceof HTMLTextAreaElement);

    if (!textarea) {
      this._textareaRef = null;
      return;
    }

    this._textareaRef = new WeakRef(textarea);
    this._prevValue = textarea.value;
    this._addTextareaListeners(textarea);
    this._linkDescribedBy(textarea);

    // Adopt size from textarea if the host has no explicit inline dimensions
    this._adoptTextareaSize(textarea);

    // Typography sync (shadow DOM may not be ready yet on first call)
    if (this._$mirror) {
      this._syncTypography(textarea);
    }

    // Apply label and readOnly
    if (this.label && !textarea.hasAttribute('aria-label')) {
      textarea.setAttribute('aria-label', this.label);
    }
    if (this.readOnly) {
      textarea.readOnly = true;
    }

    this._scheduleUpdate();
  };

  private _addTextareaListeners(textarea: HTMLTextAreaElement) {
    textarea.addEventListener('input', this._onInput);
    textarea.addEventListener('scroll', this._onScroll);
    textarea.addEventListener('focus', this._onFocus);
    textarea.addEventListener('blur', this._onBlur);
    textarea.addEventListener('select', this._onSelect);
    textarea.addEventListener('invalid', this._onInvalid);
  }

  private _removeTextareaListeners(textarea: HTMLTextAreaElement) {
    textarea.removeEventListener('input', this._onInput);
    textarea.removeEventListener('scroll', this._onScroll);
    textarea.removeEventListener('focus', this._onFocus);
    textarea.removeEventListener('blur', this._onBlur);
    textarea.removeEventListener('select', this._onSelect);
    textarea.removeEventListener('invalid', this._onInvalid);
  }

  /**
   * Appends the diagnostic-status live region's ID to the textarea's
   * `aria-describedby`, merging with any existing consumer-provided value.
   * This is a best-effort enhancement: browsers that resolve cross-shadow
   * ARIA IDrefs will associate the live region with the field.
   */
  private _linkDescribedBy(textarea: HTMLTextAreaElement): void {
    const existing = textarea.getAttribute('aria-describedby') ?? '';
    const ids = existing ? existing.split(/\s+/).filter(Boolean) : [];
    if (!ids.includes('diagnostic-status')) {
      ids.push('diagnostic-status');
      textarea.setAttribute('aria-describedby', ids.join(' '));
    }
  }

  private _unlinkDescribedBy(textarea: HTMLTextAreaElement): void {
    const existing = textarea.getAttribute('aria-describedby') ?? '';
    const ids = existing.split(/\s+/).filter((id) => id !== 'diagnostic-status');
    if (ids.length > 0) {
      textarea.setAttribute('aria-describedby', ids.join(' '));
    } else {
      textarea.removeAttribute('aria-describedby');
    }
  }

  // ─── Typography sync ───────────────────────────────────────────────────────

  private _syncTypography(textarea: HTMLTextAreaElement) {
    const mirror = this._$mirror;
    if (!mirror) return;

    const cs = getComputedStyle(textarea);
    const props = [
      'font-family',
      'font-size',
      'font-weight',
      'font-style',
      'font-variant',
      'line-height',
      'letter-spacing',
      'word-spacing',
      'text-indent',
      'padding-top',
      'padding-right',
      'padding-bottom',
      'padding-left',
      'border-top-width',
      'border-right-width',
      'border-bottom-width',
      'border-left-width',
      'box-sizing',
      'tab-size',
    ] as const;

    for (const prop of props) {
      mirror.style.setProperty(prop, cs.getPropertyValue(prop));
    }
    // Do NOT copy white-space or overflow — those are CSS-controlled by host attributes
  }

  // ─── Initial size adoption ─────────────────────────────────────────────────

  private _adoptTextareaSize(textarea: HTMLTextAreaElement) {
    // Only adopt if the host has no explicit inline width/height
    if (this.style.width !== '' || this.style.height !== '') return;

    // 1. Prefer inline styles on the textarea itself (unaffected by ::slotted() CSS)
    if (textarea.style.width) this.style.width = textarea.style.width;
    if (textarea.style.height) this.style.height = textarea.style.height;
    if (this.style.width && this.style.height) return;

    // 2. Fall back to rows/cols attributes
    const rows = textarea.getAttribute('rows');
    const cols = textarea.getAttribute('cols');

    if (rows && !this.style.height) {
      const r = parseInt(rows, 10);
      if (r > 0) {
        this.style.height = `calc(${r} * var(--rc-textarea-line-height, 1.5) * var(--rc-textarea-font-size, 1em) + 2 * var(--rc-textarea-padding, 0.5em))`;
      }
    }
    if (cols && !this.style.width) {
      const c = parseInt(cols, 10);
      if (c > 0) {
        // 0.6em is a reasonable approximation for monospace character width
        this.style.width = `calc(${c} * 0.6em + 2 * var(--rc-textarea-padding, 0.5em))`;
      }
    }
  }

  // ─── Event handlers ────────────────────────────────────────────────────────

  private _onInput = () => {
    const textarea = this._textareaRef?.deref();
    if (!textarea) return;

    const newValue = textarea.value;
    const oldValue = this._prevValue;

    // Detect large changes (paste, select-all+type) and clear decorations
    const edit = findEdit(oldValue, newValue);
    if (isLargeChange(oldValue, edit)) {
      this._decorations.clear();
      this._diagnostics.clear();
    } else {
      const { decorations: mapped, diagnostics: mappedDiags } =
        mapDecorationsThroughChange(
          [...this._decorations.values()],
          [...this._diagnostics.values()],
          oldValue,
          newValue,
        );
      this._decorations = new Map(mapped.map((d) => [d.id, d]));
      this._diagnostics = new Map(mappedDiags.map((d) => [d.id, d]));
    }

    this._prevValue = newValue;
    this._patternDecorations = matchPatterns(newValue, [...this._patterns.values()]);
    this._scheduleUpdate();

    this.dispatchEvent(
      new CustomEvent<{ value: string }>('rc-textarea-change', {
        bubbles: true,
        composed: true,
        detail: { value: newValue },
      }),
    );
    this._updateAriaInvalid(textarea);
  };

  private _onScroll = () => {
    const textarea = this._textareaRef?.deref();
    if (!textarea) return;

    const mirror = this._$mirror;
    if (mirror) {
      mirror.scrollTop = textarea.scrollTop;
      mirror.scrollLeft = textarea.scrollLeft;
    }

    const lineNumbers = this._$lineNumbers;
    if (lineNumbers) {
      lineNumbers.scrollTop = textarea.scrollTop;
    }
  };

  private _onFocus = () => {
    this.dispatchEvent(
      new CustomEvent('rc-textarea-focus', { bubbles: true, composed: true }),
    );
  };

  private _onBlur = () => {
    this.dispatchEvent(
      new CustomEvent('rc-textarea-blur', { bubbles: true, composed: true }),
    );
  };

  private _onSelect = () => {
    const textarea = this._textareaRef?.deref();
    if (!textarea) return;
    this.dispatchEvent(
      new CustomEvent<{ selectionStart: number; selectionEnd: number }>(
        'rc-textarea-select',
        {
          bubbles: true,
          composed: true,
          detail: {
            selectionStart: textarea.selectionStart ?? 0,
            selectionEnd: textarea.selectionEnd ?? 0,
          },
        },
      ),
    );
  };

  private _onInvalid = () => {
    const textarea = this._textareaRef?.deref();
    if (textarea) this._updateAriaInvalid(textarea);
  };

  // ─── Batched rendering ─────────────────────────────────────────────────────

  private _scheduleUpdate() {
    if (this._rafHandle !== null) return;
    this._rafHandle = requestAnimationFrame(() => {
      this._rafHandle = null;
      this._performUpdate();
    });
  }

  private _performUpdate() {
    const textarea = this._textareaRef?.deref();
    const value = textarea?.value ?? '';
    const lineCount = value.split('\n').length;

    const allDecorations: Decoration[] = [
      ...this._decorations.values(),
      ...this._patternDecorations,
    ];

    const mirror = this._$mirror;
    if (mirror) {
      mirror.innerHTML = renderMirror(
        value,
        allDecorations,
        [...this._diagnostics.values()],
      );
    }

    const lineNumbers = this._$lineNumbers;
    if (lineNumbers) {
      // In word-wrap mode, mirror lines can span multiple visual rows. Measure
      // each line's actual offsetHeight so gutter numbers stay aligned.
      let lineHeights: number[] | undefined;
      if (this.wordWrap && mirror) {
        lineHeights = [...mirror.querySelectorAll<HTMLElement>('.line')].map(
          (el) => el.offsetHeight,
        );
      }
      lineNumbers.innerHTML = renderGutter(lineCount, lineHeights);
    }

    this._updateDiagnosticStatus();
  }

  private _updateDiagnosticStatus() {
    const el = this._$diagnosticStatus;
    if (!el) return;

    const diags = [...this._diagnostics.values()];
    if (diags.length === 0) {
      el.textContent = '';
      return;
    }

    const summary = diags
      .map((d) => `Line ${d.line} ${d.severity}: ${d.message}`)
      .join('; ');
    el.textContent = `${diags.length} diagnostic${diags.length !== 1 ? 's' : ''}: ${summary}`;
  }

  /**
   * Reflects validation state onto the slotted textarea's `aria-invalid`
   * attribute. Sets it when there are error-severity diagnostics or when the
   * textarea's native constraint validation is failing; removes it otherwise.
   */
  private _updateAriaInvalid(textarea: HTMLTextAreaElement): void {
    const hasErrors = [...this._diagnostics.values()].some(
      (d) => d.severity === 'error',
    );
    if (hasErrors || !textarea.validity.valid) {
      textarea.setAttribute('aria-invalid', 'true');
    } else {
      textarea.removeAttribute('aria-invalid');
    }
  }

  // ─── Decoration style injection ────────────────────────────────────────────

  /**
   * Inject CSS text into the component's shadow root so that class-based
   * decoration rules (e.g. `.kw { color: purple }`) apply to the mirror.
   *
   * Light-DOM stylesheets do not pierce the shadow boundary, so decoration
   * classes must be registered via this method rather than a page `<style>`.
   * Call it again with updated CSS to replace the previous sheet.
   */
  setDecorationStyles(cssText: string): void {
    if (!this.shadowRoot) return;
    if (this._decorationStyleSheet) {
      this._decorationStyleSheet.replaceSync(cssText);
    } else {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(cssText);
      this._decorationStyleSheet = sheet;
      this.shadowRoot.adoptedStyleSheets = [
        ...this.shadowRoot.adoptedStyleSheets,
        sheet,
      ];
    }
  }

  // ─── Public value API ──────────────────────────────────────────────────────

  /** Get or set the textarea value. */
  get value(): string {
    return this._textareaRef?.deref()?.value ?? '';
  }

  set value(v: string) {
    const textarea = this._textareaRef?.deref();
    if (!textarea) return;

    const oldValue = textarea.value;
    textarea.value = v;

    const edit = findEdit(oldValue, v);
    if (isLargeChange(oldValue, edit)) {
      this._decorations.clear();
      this._diagnostics.clear();
    } else {
      const { decorations: mapped, diagnostics: mappedDiags } =
        mapDecorationsThroughChange(
          [...this._decorations.values()],
          [...this._diagnostics.values()],
          oldValue,
          v,
        );
      this._decorations = new Map(mapped.map((d) => [d.id, d]));
      this._diagnostics = new Map(mappedDiags.map((d) => [d.id, d]));
    }

    this._prevValue = v;
    this._patternDecorations = matchPatterns(v, [...this._patterns.values()]);
    this._scheduleUpdate();
  }

  // ─── Decoration API ────────────────────────────────────────────────────────

  addDecoration(decoration: DecorationInput): string {
    const id = generateId();
    this._decorations.set(id, { ...decoration, id } as Decoration);
    this._scheduleUpdate();
    return id;
  }

  removeDecoration(id: string): void {
    this._decorations.delete(id);
    this._scheduleUpdate();
  }

  updateDecoration(id: string, patch: Partial<DecorationInput>): void {
    const existing = this._decorations.get(id);
    if (!existing) return;
    this._decorations.set(id, { ...existing, ...patch } as Decoration);
    this._scheduleUpdate();
  }

  clearDecorations(): void {
    this._decorations.clear();
    this._scheduleUpdate();
  }

  setDecorations(decorations: DecorationInput[]): void {
    this._decorations.clear();
    for (const d of decorations) {
      const id = generateId();
      this._decorations.set(id, { ...d, id } as Decoration);
    }
    this._scheduleUpdate();
  }

  // ─── Diagnostic API ────────────────────────────────────────────────────────

  addDiagnostic(diagnostic: Omit<Diagnostic, 'id'>): string {
    const id = generateId();
    this._diagnostics.set(id, { ...diagnostic, id });
    this._scheduleUpdate();
    this._updateDiagnosticStatus();
    const textarea = this._textareaRef?.deref();
    if (textarea) this._updateAriaInvalid(textarea);
    return id;
  }

  removeDiagnostic(id: string): void {
    this._diagnostics.delete(id);
    this._scheduleUpdate();
    this._updateDiagnosticStatus();
    const textarea = this._textareaRef?.deref();
    if (textarea) this._updateAriaInvalid(textarea);
  }

  clearDiagnostics(): void {
    this._diagnostics.clear();
    this._scheduleUpdate();
    this._updateDiagnosticStatus();
    const textarea = this._textareaRef?.deref();
    if (textarea) this._updateAriaInvalid(textarea);
  }

  setDiagnostics(diagnostics: Omit<Diagnostic, 'id'>[]): void {
    this._diagnostics.clear();
    for (const d of diagnostics) {
      const id = generateId();
      this._diagnostics.set(id, { ...d, id });
    }
    this._scheduleUpdate();
    this._updateDiagnosticStatus();
    const textarea = this._textareaRef?.deref();
    if (textarea) this._updateAriaInvalid(textarea);
  }

  // ─── Pattern API ───────────────────────────────────────────────────────────

  addPattern(pattern: Omit<TextPattern, 'id'>): string {
    const id = generateId();
    this._patterns.set(id, { ...pattern, id });
    this._patternDecorations = matchPatterns(this.value, [...this._patterns.values()]);
    this._scheduleUpdate();
    return id;
  }

  removePattern(id: string): void {
    this._patterns.delete(id);
    this._patternDecorations = matchPatterns(this.value, [...this._patterns.values()]);
    this._scheduleUpdate();
  }

  clearPatterns(): void {
    this._patterns.clear();
    this._patternDecorations = [];
    this._scheduleUpdate();
  }

  // ─── Navigation API ────────────────────────────────────────────────────────

  /**
   * Scrolls the editor to make the given 1-based logical line number visible.
   */
  revealLine(lineNumber: number): void {
    const textarea = this._textareaRef?.deref();
    if (!textarea) return;

    const cs = getComputedStyle(textarea);
    const lineHeightStr = cs.lineHeight;
    const lineHeight =
      lineHeightStr === 'normal'
        ? parseFloat(cs.fontSize) * 1.2
        : parseFloat(lineHeightStr);
    const paddingTop = parseFloat(cs.paddingTop);

    textarea.scrollTop = paddingTop + (lineNumber - 1) * lineHeight;
    // Sync mirror and gutter immediately
    this._onScroll();
  }
}

export default RCTextarea;
