import { LitElement, html, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { NativeChildController, keyInteraction, warnMissingDirectChild } from '@rcarls/rc-common';

import searchBarStyles from './rc-search-bar.styles';

const _uaClearSheet = new CSSStyleSheet();
_uaClearSheet.replaceSync(
  `rc-search-bar:not([allow-native-clear]) input[type="search"]::-webkit-search-cancel-button
   { -webkit-appearance: none; display: none; }`,
);
let _uaClearSuppressed = false;

function _suppressUaClear(): void {
  if (_uaClearSuppressed) {
    return;
  }

  document.adoptedStyleSheets = [...document.adoptedStyleSheets, _uaClearSheet];

  _uaClearSuppressed = true;
}

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
 * The native WebKit cancel button is suppressed by default via an
 * adopted document stylesheet. Set `allow-native-clear` to restore it.
 * When restored, the native button clears through the normal input path
 * (a debounced `rc-search-bar-input` with an empty value) and never fires
 * `rc-search-bar-clear`.
 *
 * @slot - The required native `<input type="search">`
 * @slot leading - Decorative leading icon; mark it `aria-hidden="true"`
 * @slot trailing - Optional trailing content after the clear button
 * @slot clear-icon - Optional glyph replacing the default clear glyph
 *
 * @fires rc-search-bar-input - Debounced after typing, immediate on clear;
 *   `detail: { value }`
 * @fires rc-search-bar-clear - When the clear button is activated
 *
 * @cssprop [--rc-search-bar-border=1px solid ButtonBorder] - Wrapper border; set to `none` in M3 theme (uses elevation instead)
 * @cssprop [--rc-search-bar-shadow=none] - Wrapper box-shadow for elevation; M3 theme sets Level 1 at rest
 * @cssprop [--rc-search-bar-bg=Field] - Wrapper background
 * @cssprop [--rc-search-bar-color=FieldText] - Wrapper text color
 * @cssprop [--rc-search-bar-icon-color=GrayText] - Leading icon color
 * @cssprop [--rc-search-bar-clear-color=GrayText] - Clear button glyph color
 * @cssprop [--rc-search-bar-radius=var(--rc-control-radius,0.125em)] - Wrapper border radius
 * @cssprop [--rc-search-bar-height=var(--rc-control-block-size,2.5rem)] - Wrapper block size
 * @cssprop [--rc-search-bar-padding-inline=var(--rc-control-padding-inline,0.75rem)] - Wrapper horizontal padding
 * @cssprop [--rc-search-bar-gap=var(--rc-control-gap,0.25em)] - Gap between icon, input, and clear button
 * @cssprop [--rc-search-bar-input-font-size] - Input font size (inherits when unset)
 * @cssprop [--rc-search-bar-input-font-family] - Input font family (inherits when unset)
 * @cssprop [--rc-search-bar-input-color] - Input text color (inherits when unset)
 * @csspart root - The wrapper element
 * @csspart leading - Wrapper around the leading icon slot
 * @csspart trailing - Wrapper around the trailing slot
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

  /** When set, leaves the browser's native WebKit cancel button visible. */
  @property({ type: Boolean, attribute: 'allow-native-clear', reflect: true })
  allowNativeClear = false;

  /**
   * When set, the clear button is visible whenever the input is focused.
   *
   * Matching the Apple HIG "cancel" pattern.
   * Consider setting `clear-label="Cancel"` in this mode.
   */
  @property({ type: Boolean, attribute: 'show-clear-on-focus' })
  showClearOnFocus = false;

  /** Disables the component and mirrors the state to the slotted input. */
  @property({ type: Boolean, reflect: true })
  get disabled(): boolean {
    // _disabledHost holds what the host last set; fall back to what the input
    // actually reports (kept in sync by the MutationObserver).
    return this._disabledHost ?? this._inputDisabled;
  }
  set disabled(value: boolean) {
    const old = this.disabled;
    this._disabledHost = value;

    const $input = this._$input();
    if ($input) {
      $input.disabled = value;
    }

    this.requestUpdate('disabled', old);
  }

  /**
   * Placeholder mirrored onto the native input.
   *
   * Consumer `placeholder` attribute is always honored.
   */
  @property({ type: String })
  placeholder?: string;

  private _value: string | undefined = undefined;

  private _defaultValue: string | undefined = undefined;

  private _valueSetByHost = false;

  /** True once an author value, host write, or user input owns the value. */
  private _valueInitialized = false;

  private _authorPlaceholder = false;

  private _$inputRef: WeakRef<HTMLInputElement> | null = null;

  private _debounceTimer: ReturnType<typeof setTimeout> | undefined = undefined;

  @state()
  private _hasInput = false;

  @state()
  private _hasValue = false;

  @state()
  private _hasLeading = false;

  @state()
  private _hasTrailing = false;

  @state()
  private _inputDisabled = false;

  // Tracks the last value written via the disabled setter so the getter and
  // Lit's reflect can return it before the input is slotted.
  private _disabledHost: boolean | undefined = undefined;

  @state()
  private _focused = false;

  private readonly _onInputFocus = (): void => {
    this._focused = true;
  };

  private readonly _onInputBlur = (): void => {
    this._focused = false;
  };

  private readonly _disabledObserver = new MutationObserver(() => {
    const $input = this._$input();

    if ($input) {
      this._inputDisabled = $input.disabled;
    }
  });

  private readonly _inputController = new NativeChildController<HTMLInputElement>(this, {
    selector: ':scope > input[type="search"]',
    observe: true,
    onChange: ($input, $previousInput) => this._setupInput($input, $previousInput),
    onMissing: () => {
      if (import.meta.env.DEV) {
        warnMissingDirectChild(this, {
          selector: ':scope > input[type="search"]',
          message:
            '[rc-search-bar] No direct child <input type="search"> found. ' +
            'Place a native search input inside <rc-search-bar>.',
        });
      }
    },
  });

  /**
   * The current search value. Reads from the native input when present.
   * Host writes are silent (no events) and win over slotted author values.
   */
  @property({ attribute: false })
  get value(): string {
    return this._$input()?.value ?? this._value ?? this._defaultValue ?? '';
  }
  set value(value: string) {
    const oldValue = this.value;

    this._value = value;
    this._valueSetByHost = true;
    this._valueInitialized = true;

    const $input = this._$input();

    if ($input) {
      $input.value = value;
    }

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

    const $input = this._$input();
    if ($input && value !== undefined && !this._valueInitialized) {
      $input.value = value;
      this._hasValue = value.length > 0;
    }

    this.requestUpdate('defaultValue', oldValue);
  }

  override connectedCallback(): void {
    super.connectedCallback();

    _suppressUaClear();
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();

    this._focused = false;
    this._cancelPendingInput();

    const $input = this._$input();

    $input?.removeEventListener('input', this._onNativeInput);
    $input?.removeEventListener('focus', this._onInputFocus);
    $input?.removeEventListener('blur', this._onInputBlur);

    this._disabledObserver.disconnect();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has('placeholder')) {
      const $input = this._$input();

      if ($input) {
        this._applyPlaceholder($input);
      }
    }
  }

  private _$input(): HTMLInputElement | null {
    return this._$inputRef?.deref() ?? null;
  }

  private _handleSlotChange(): void {
    this._inputController.sync();
  }

  private _setupInput(
    $input: HTMLInputElement | null,
    $previousInput: HTMLInputElement | null,
  ): void {
    if ($previousInput && $previousInput !== $input) {
      $previousInput.removeEventListener('input', this._onNativeInput);
      $previousInput.removeEventListener('focus', this._onInputFocus);
      $previousInput.removeEventListener('blur', this._onInputBlur);
    }

    this._disabledObserver.disconnect();
    this._focused = false;

    this._$inputRef = $input ? new WeakRef($input) : null;
    this._hasInput = $input !== null;
    this._authorPlaceholder = $input?.hasAttribute('placeholder') ?? false;

    if (!$input) {
      this._hasValue = false;

      return;
    }

    // Deferred reads keep framework render cycles (e.g. SolidJS) untouched.
    queueMicrotask(() => {
      if (!$input.isConnected) {
        return;
      }

      if (this._valueSetByHost) {
        $input.value = this._value ?? '';
      } else if ($input.value) {
        // An author-provided value wins over defaultValue.
        this._valueInitialized = true;
      } else if (this._defaultValue !== undefined && !this._valueInitialized) {
        $input.value = this._defaultValue;
      }

      this._applyPlaceholder($input);

      if (this._disabledHost !== undefined) {
        $input.disabled = this._disabledHost;
      }

      this._inputDisabled = $input.disabled;
      this._hasValue = $input.value.length > 0;

      if (
        import.meta.env.DEV &&
        !$input.labels?.length &&
        !$input.getAttribute('aria-label') &&
        !$input.getAttribute('aria-labelledby')
      ) {
        console.warn(
          '[rc-search-bar] Slotted <input type="search"> has no accessible name.',
          'Add aria-label, wrap in <label>, or use <label for="...">.',
          $input,
        );
      }

      this._bindInput($input);
    });
  }

  private _bindInput($input: HTMLInputElement): void {
    $input.addEventListener('input', this._onNativeInput);
    $input.addEventListener('focus', this._onInputFocus);
    $input.addEventListener('blur', this._onInputBlur);

    this._disabledObserver.observe($input, { attributeFilter: ['disabled'] });
  }

  private _applyPlaceholder($input: HTMLInputElement): void {
    if (this.placeholder === undefined || this._authorPlaceholder) {
      return;
    }

    $input.placeholder = this.placeholder;
  }

  private readonly _onNativeInput = (e: Event): void => {
    const $input = e.currentTarget as HTMLInputElement;

    this._valueInitialized = true;
    this._hasValue = $input.value.length > 0;
    this._scheduleInputEvent($input.value);
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
    if (this._debounceTimer === undefined) {
      return;
    }

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
    const $input = this._$input();

    if (!$input) {
      return;
    }

    this._cancelPendingInput();

    $input.value = '';

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
    $input.focus();
  }

  protected override render() {
    return html`
      <div id="root" part="root" class=${classMap({ empty: !this._hasInput })} ${keyInteraction({ attributeTarget: this })}>
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
          ?hidden=${!this._hasInput}
          ?inert=${this._hasInput && !this._hasValue && !(this.showClearOnFocus && this._focused)}
          ?disabled=${this._inputDisabled}
          @click=${this._handleClear}
        >
          <slot name="clear-icon"><span aria-hidden="true">&#10005;</span></slot>
        </button>

        <span id="trailing" part="trailing" class=${classMap({ empty: !this._hasTrailing })}>
          <slot name="trailing" @slotchange=${this._onTrailingSlotChange}></slot>
        </span>
      </div>
    `;
  }

  /** Programmatically clears the value and fires rc-search-bar-clear + rc-search-bar-input. */
  public clear(): void {
    this._handleClear();
  }

  private _onLeadingSlotChange(e: Event): void {
    const $slot = e.target as HTMLSlotElement;

    this._hasLeading = $slot.assignedElements().length > 0;
  }

  private _onTrailingSlotChange(e: Event): void {
    const $slot = e.target as HTMLSlotElement;

    this._hasTrailing = $slot.assignedElements().length > 0;
  }
}

export default RCSearchBar;
