import { LitElement, html, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import searchBarStyles from './rc-search-bar.styles';

declare global {
  interface HTMLElementTagNameMap {
    'rc-search-bar': RCSearchBar;
  }
}

export interface RCSearchBarInputDetail {
  /** The native input's value at dispatch time. */
  value: string;
}

/**
 * Enhances a consumer-provided native `<input type="search">` with leading
 * icon chrome, an accessible clear button, and debounced search events.
 *
 * The native input is required and stays in light DOM as the source of
 * truth, so form submission, `label[for]`/wrapping-label association, and
 * pre-upgrade behavior are preserved. Without a slotted search input the
 * component renders no chrome and stays inert.
 *
 * The native WebKit cancel button is not suppressed; hiding it is documented
 * consumer CSS. It clears through the normal input path (a debounced
 * `rc-search-bar-input` with an empty value) and never fires
 * `rc-search-bar-clear`.
 *
 * @slot - The required native `<input type="search">`
 * @slot leading - Decorative leading icon; mark it `aria-hidden="true"`
 * @slot clear-icon - Optional glyph replacing the default clear glyph
 * @fires rc-search-bar-input - Debounced after typing, immediate on clear;
 *   `detail: { value }`
 * @fires rc-search-bar-clear - When the clear button is activated
 * @cssprop [--rc-search-bar-bg=Field] - Wrapper background
 * @cssprop [--rc-search-bar-color=FieldText] - Wrapper text color
 * @cssprop [--rc-search-bar-icon-color=GrayText] - Leading icon color
 * @cssprop [--rc-search-bar-clear-color=GrayText] - Clear button glyph color
 * @cssprop [--rc-search-bar-radius=var(--rc-control-radius)] - Wrapper border radius
 * @cssprop [--rc-search-bar-height=48px] - Wrapper block size
 * @cssprop [--rc-search-bar-padding-inline=0.5em] - Wrapper horizontal padding
 * @cssprop [--rc-search-bar-gap=0.25em] - Gap between icon, input, and clear button
 * @csspart root - The wrapper element
 * @csspart leading - Wrapper around the leading icon slot
 * @csspart clear - The clear button
 */
export class RCSearchBar extends LitElement {
  static styles = [searchBarStyles];

  /** Debounce window in ms for `rc-search-bar-input`; `0` dispatches synchronously. */
  @property({ type: Number })
  debounce = 200;

  /** Accessible label for the clear button. */
  @property({ type: String, attribute: 'clear-label' })
  clearLabel = 'Clear search';

  /**
   * Placeholder mirrored onto the native input. An author `placeholder`
   * attribute already present on the input is never overwritten.
   */
  @property({ type: String })
  placeholder?: string;

  private _value: string | undefined = undefined;

  private _defaultValue: string | undefined = undefined;

  private _valueSetByHost = false;

  /** True once an author value, host write, or user input owns the value. */
  private _valueInitialized = false;

  private _authorPlaceholder = false;

  private _inputRef: WeakRef<HTMLInputElement> | null = null;

  private _debounceTimer: ReturnType<typeof setTimeout> | undefined = undefined;

  @state()
  private _hasInput = false;

  @state()
  private _hasValue = false;

  @state()
  private _hasLeading = false;

  @state()
  private _inputDisabled = false;

  private readonly _disabledObserver = new MutationObserver(() => {
    const input = this._input();
    if (input) this._inputDisabled = input.disabled;
  });

  /**
   * The current search value. Reads from the native input when present.
   * Host writes are silent (no events) and win over slotted author values.
   */
  @property({ attribute: false })
  get value(): string {
    return this._input()?.value ?? this._value ?? this._defaultValue ?? '';
  }
  set value(value: string) {
    const oldValue = this.value;

    this._value = value;
    this._valueSetByHost = true;
    this._valueInitialized = true;

    const input = this._input();
    if (input) input.value = value;
    this._hasValue = value.length > 0;

    this.requestUpdate('value', oldValue);
  }

  /**
   * Initial uncontrolled value hint. Applied once, and only when neither an
   * author `value`, a host `value` write, nor user input owns the value.
   */
  @property({ type: String, attribute: 'default-value' })
  get defaultValue(): string | undefined {
    return this._defaultValue;
  }
  set defaultValue(value: string | undefined) {
    const oldValue = this._defaultValue;

    this._defaultValue = value;

    const input = this._input();
    if (input && value !== undefined && !this._valueInitialized) {
      input.value = value;
      this._hasValue = value.length > 0;
    }

    this.requestUpdate('defaultValue', oldValue);
  }

  override connectedCallback(): void {
    super.connectedCallback();

    // Slot assignment survives a DOM move without re-firing slotchange, so
    // listeners are re-bound here (addEventListener is idempotent per ref).
    const input = this._input();
    if (input) this._bindInput(input);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();

    this._cancelPendingInput();
    this._input()?.removeEventListener('input', this._onNativeInput);
    this._disabledObserver.disconnect();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has('placeholder')) {
      const input = this._input();
      if (input) this._applyPlaceholder(input);
    }
  }

  private _input(): HTMLInputElement | null {
    return this._inputRef?.deref() ?? null;
  }

  private _handleSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    const input =
      slot
        .assignedElements({ flatten: true })
        .find(
          (el): el is HTMLInputElement =>
            el instanceof HTMLInputElement && el.type === 'search',
        ) ?? null;

    const previous = this._input();
    if (previous && previous !== input) {
      previous.removeEventListener('input', this._onNativeInput);
    }
    this._disabledObserver.disconnect();

    this._inputRef = input ? new WeakRef(input) : null;
    this._hasInput = input !== null;

    if (!input) {
      this._hasValue = false;

      return;
    }

    // Deferred reads keep framework render cycles (e.g. SolidJS) untouched.
    queueMicrotask(() => {
      if (!input.isConnected) return;

      if (this._valueSetByHost) {
        input.value = this._value ?? '';
      } else if (input.value) {
        // An author-provided value wins over defaultValue.
        this._valueInitialized = true;
      } else if (this._defaultValue !== undefined && !this._valueInitialized) {
        input.value = this._defaultValue;
      }

      this._authorPlaceholder = input.hasAttribute('placeholder');
      this._applyPlaceholder(input);

      this._inputDisabled = input.disabled;
      this._hasValue = input.value.length > 0;

      this._bindInput(input);
    });
  }

  private _bindInput(input: HTMLInputElement): void {
    input.addEventListener('input', this._onNativeInput);
    this._disabledObserver.observe(input, { attributeFilter: ['disabled'] });
  }

  private _applyPlaceholder(input: HTMLInputElement): void {
    if (this.placeholder === undefined || this._authorPlaceholder) return;

    input.placeholder = this.placeholder;
  }

  private readonly _onNativeInput = (e: Event): void => {
    const input = e.currentTarget as HTMLInputElement;

    this._valueInitialized = true;
    this._hasValue = input.value.length > 0;
    this._scheduleInputEvent(input.value);
  };

  private _scheduleInputEvent(value: string): void {
    this._cancelPendingInput();

    if (this.debounce <= 0) {
      this._dispatchInput(value);

      return;
    }

    this._debounceTimer = setTimeout(() => {
      this._debounceTimer = undefined;
      this._dispatchInput(value);
    }, this.debounce);
  }

  private _cancelPendingInput(): void {
    if (this._debounceTimer === undefined) return;

    clearTimeout(this._debounceTimer);
    this._debounceTimer = undefined;
  }

  private _dispatchInput(value: string): void {
    this.dispatchEvent(
      new CustomEvent<RCSearchBarInputDetail>('rc-search-bar-input', {
        bubbles: true,
        composed: true,
        detail: { value },
      }),
    );
  }

  private _handleClear(): void {
    const input = this._input();
    if (!input) return;

    this._cancelPendingInput();

    input.value = '';
    this._valueInitialized = true;
    this._hasValue = false;

    this.dispatchEvent(
      new CustomEvent('rc-search-bar-clear', {
        bubbles: true,
        composed: true,
        detail: {},
      }),
    );
    this._dispatchInput('');

    // Refocus before the re-render hides the button, so focus never drops
    // to <body>.
    input.focus();
  }

  protected override render() {
    return html`
      <div id="root" part="root" class=${classMap({ empty: !this._hasInput })}>
        <span
          id="leading"
          part="leading"
          class=${classMap({ empty: !this._hasLeading || !this._hasInput })}
        >
          <slot name="leading" @slotchange=${this._onLeadingSlotChange}></slot>
        </span>
        <slot @slotchange=${this._handleSlotChange}></slot>
        <button
          id="clear"
          part="clear"
          type="button"
          aria-label=${this.clearLabel}
          ?hidden=${!this._hasInput || !this._hasValue}
          ?disabled=${this._inputDisabled}
          @click=${this._handleClear}
        >
          <slot name="clear-icon"><span aria-hidden="true">&#10005;</span></slot>
        </button>
      </div>
    `;
  }

  private _onLeadingSlotChange(e: Event): void {
    const slot = e.target as HTMLSlotElement;
    this._hasLeading = slot.assignedElements().length > 0;
  }
}

export default RCSearchBar;
