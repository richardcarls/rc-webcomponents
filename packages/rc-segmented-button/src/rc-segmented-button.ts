import { LitElement, html } from 'lit';
import type { PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';

import segmentedButtonStyles from './rc-segmented-button.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-segmented-button': RCSegmentedButton;
  }

  interface HTMLElementEventMap {
    'rc-segmented-button-change': CustomEvent<RCSegmentedButtonChangeDetail>;
  }
}

const LIGHT_DOM_CSS = `
@layer rc-base {
  rc-segmented-button > fieldset {
    display: var(--_rc-segmented-button-fieldset-display, revert);
    margin: var(--_rc-segmented-button-fieldset-margin, revert);
    padding: var(--_rc-segmented-button-fieldset-padding, revert);
    border: var(--_rc-segmented-button-fieldset-border, revert);
    border-radius: var(--_rc-segmented-button-fieldset-radius, revert);
    overflow: var(--_rc-segmented-button-fieldset-overflow, revert);
  }

  rc-segmented-button[orientation='vertical'] > fieldset {
    flex-direction: column;
  }

  rc-segmented-button > fieldset > legend {
    position: var(--_rc-segmented-button-legend-position, revert);
    inline-size: var(--_rc-segmented-button-legend-inline-size, revert);
    block-size: var(--_rc-segmented-button-legend-block-size, revert);
    margin: var(--_rc-segmented-button-legend-margin, revert);
    padding: var(--_rc-segmented-button-legend-padding, revert);
    border: var(--_rc-segmented-button-legend-border, revert);
    overflow: var(--_rc-segmented-button-legend-overflow, revert);
    clip: var(--_rc-segmented-button-legend-clip, revert);
    white-space: var(--_rc-segmented-button-legend-white-space, revert);
  }

  rc-segmented-button > fieldset > label {
    display: var(--_rc-segmented-button-segment-display, revert);
    align-items: center;
    justify-content: center;
    gap: var(--rc-segmented-button-segment-gap);
    min-block-size: var(--rc-segmented-button-segment-min-block-size);
    padding-block: var(--rc-segmented-button-segment-padding-block, revert);
    padding-inline: var(--rc-segmented-button-segment-padding-inline, revert);
    border: var(--rc-segmented-button-border, revert);
    color: var(--rc-segmented-button-color, revert);
    background: var(--rc-segmented-button-bg, revert);
    cursor: var(--_rc-segmented-button-segment-cursor, revert);
    user-select: var(--_rc-segmented-button-segment-user-select, revert);
  }

  rc-segmented-button > fieldset > label:first-of-type {
    border-start-start-radius: var(--rc-segmented-button-radius, revert);
    border-end-start-radius: var(--rc-segmented-button-radius, revert);
  }

  rc-segmented-button > fieldset > label:last-of-type {
    border-start-end-radius: var(--rc-segmented-button-radius, revert);
    border-end-end-radius: var(--rc-segmented-button-radius, revert);
  }

  rc-segmented-button > fieldset > label + label {
    border-inline-start: var(--rc-segmented-button-divider, revert);
  }

  rc-segmented-button[orientation='vertical'] > fieldset > label + label {
    border-inline-start: var(--_rc-segmented-button-vertical-border-inline-start, revert);
    border-block-start: var(--rc-segmented-button-divider, revert);
  }

  rc-segmented-button[orientation='vertical'] > fieldset > label:first-of-type {
    border-start-start-radius: var(--rc-segmented-button-radius, revert);
    border-start-end-radius: var(--rc-segmented-button-radius, revert);
    border-end-start-radius: 0;
  }

  rc-segmented-button[orientation='vertical'] > fieldset > label:last-of-type {
    border-start-end-radius: 0;
    border-end-start-radius: var(--rc-segmented-button-radius, revert);
    border-end-end-radius: var(--rc-segmented-button-radius, revert);
  }

  rc-segmented-button > fieldset > label:has(input[type='radio']:checked) {
    color: var(--rc-segmented-button-selected-color, revert);
    background: var(--rc-segmented-button-selected-bg, revert);
  }

  rc-segmented-button > fieldset > label:has(input[type='radio']:focus-visible) {
    outline: var(--rc-segmented-button-focus-ring, revert);
    outline-offset: var(--rc-segmented-button-focus-ring-offset, revert);
  }

  rc-segmented-button > fieldset > label:has(input[type='radio']:disabled),
  rc-segmented-button[disabled] > fieldset > label {
    opacity: var(--rc-segmented-button-disabled-opacity, revert);
    cursor: var(--_rc-segmented-button-disabled-cursor, revert);
  }

  rc-segmented-button > fieldset > label > input[type='radio'] {
    position: var(--_rc-segmented-button-radio-position, revert);
    inline-size: var(--_rc-segmented-button-radio-inline-size, revert);
    block-size: var(--_rc-segmented-button-radio-block-size, revert);
    margin: var(--_rc-segmented-button-radio-margin, revert);
    opacity: var(--_rc-segmented-button-radio-opacity, revert);
    pointer-events: var(--_rc-segmented-button-radio-pointer-events, revert);
  }

  rc-segmented-button > fieldset > label > [data-rc-segmented-button-selected-icon] {
    display: none;
  }

  rc-segmented-button > fieldset > label:has(input[type='radio']:checked) > [data-rc-segmented-button-selected-icon] {
    display: var(--_rc-segmented-button-selected-icon-display, none);
    place-items: center;
  }
}
`;

/** Detail payload for `rc-segmented-button-change`. */
export interface RCSegmentedButtonChangeDetail {
  /** Current selected radio value after user interaction. */
  value: string;
}

/**
 * Segmented button group that enhances a direct native `<fieldset>` of radio inputs.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-segmented-button rc-segmented-button docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/radio/ WAI-ARIA radio group pattern}
 *
 * @slot - A direct `<fieldset>` containing native radio inputs and labels.
 *
 * @fires rc-segmented-button-change - Fired after user interaction changes the selected value.
 *
 * @attr value - Current selected radio value. Host writes are silent.
 * @attr default-value - Initial selected value for uncontrolled usage.
 * @attr disabled - Mirrors disabled state to the native fieldset.
 * @attr orientation - Keyboard orientation: `horizontal` or `vertical`.
 *
 * @cssprop [--rc-segmented-button-segment-gap] - Gap between segment icon and label content
 *   (defers to native label layout when unset).
 * @cssprop [--rc-segmented-button-segment-min-block-size] - Minimum segment block size (defers
 *   to native label layout when unset).
 * @cssprop [--rc-segmented-button-segment-padding-block=revert] - Segment block-axis padding
 *   (defers to native label padding when unset).
 * @cssprop [--rc-segmented-button-segment-padding-inline=revert] - Segment inline-axis padding
 *   (defers to native label padding when unset).
 * @cssprop [--rc-segmented-button-border=revert] - Segment border (defers to native label border
 *   when unset).
 * @cssprop [--rc-segmented-button-color=revert] - Segment text color (defers to native label
 *   color when unset).
 * @cssprop [--rc-segmented-button-bg=revert] - Segment background (defers to native label
 *   background when unset).
 * @cssprop [--rc-segmented-button-radius=revert] - Rounded corner radius on the first and last
 *   segments (defers to native label styling when unset).
 * @cssprop [--rc-segmented-button-divider=revert] - Border between adjacent segments (defers to
 *   native label styling when unset).
 * @cssprop [--rc-segmented-button-selected-color=revert] - Segment text color when its radio is
 *   checked (defers to native label color when unset).
 * @cssprop [--rc-segmented-button-selected-bg=revert] - Segment background when its radio is
 *   checked (defers to native label background when unset).
 * @cssprop [--rc-segmented-button-focus-ring=revert] - Segment outline when its radio is
 *   focus-visible (defers to native focus styling when unset).
 * @cssprop [--rc-segmented-button-focus-ring-offset=revert] - Segment outline offset when its
 *   radio is focus-visible (defers to native focus styling when unset).
 * @cssprop [--rc-segmented-button-disabled-opacity=revert] - Segment opacity when its radio is
 *   disabled, or when the host is `disabled` (defers to native disabled styling when unset).
 */
export class RCSegmentedButton extends LitElement {
  static override styles = segmentedButtonStyles;

  private static readonly _styledRoots = new Set<Document | ShadowRoot>();

  private static _ensureBaseStyles(root: Document | ShadowRoot): void {
    if (RCSegmentedButton._styledRoots.has(root)) {
      return;
    }

    RCSegmentedButton._styledRoots.add(root);

    const style = document.createElement('style');

    style.setAttribute('data-rc-light-dom-base', 'rc-segmented-button');
    style.textContent = LIGHT_DOM_CSS;

    if (root instanceof Document) {
      root.head.append(style);
    } else {
      root.append(style);
    }
  }

  private _value = '';
  private _defaultValue = '';
  private _valueInitialized = false;
  private _$fieldset: HTMLFieldSetElement | null = null;
  private _disabledOwned = false;
  private _slotMicrotaskQueued = false;

  /** Current selected radio value. Host writes are silent. */
  @property({ type: String, reflect: true })
  get value(): string {
    return this._value || this._defaultValue;
  }

  set value(value: string | undefined) {
    const oldValue = this.value;

    this._value = value ?? '';
    this._valueInitialized = true;
    this._applyValue(false);
    this.requestUpdate('value', oldValue);
  }

  /** Initial selected value for uncontrolled usage. */
  @property({ type: String, attribute: 'default-value' })
  get defaultValue(): string {
    return this._defaultValue;
  }

  set defaultValue(value: string) {
    const oldValue = this._defaultValue;

    this._defaultValue = value;

    if (!this._valueInitialized && !this._value) {
      this._applyValue(false);
      this.requestUpdate('value', oldValue);
    }

    this.requestUpdate('defaultValue', oldValue);
  }

  /** Mirror disabled state to the native fieldset. */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Keyboard orientation. */
  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  override connectedCallback(): void {
    super.connectedCallback();
    RCSegmentedButton._ensureBaseStyles(this.getRootNode() as Document | ShadowRoot);
  }

  override disconnectedCallback(): void {
    this._$fieldset?.removeEventListener('change', this._handleChange);
    this._$fieldset?.removeEventListener('keydown', this._handleKeyDown);
    super.disconnectedCallback();
  }

  protected override firstUpdated(): void {
    this._syncFieldset();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has('disabled')) {
      this._applyDisabled();
    }
  }

  protected override render() {
    return html`<slot @slotchange=${this._handleSlotChange}></slot>`;
  }

  private _handleSlotChange(): void {
    if (this._slotMicrotaskQueued) {
      return;
    }

    this._slotMicrotaskQueued = true;

    queueMicrotask(() => {
      this._slotMicrotaskQueued = false;

      if (this.isConnected) {
        this._syncFieldset();
      }
    });
  }

  private _syncFieldset(): void {
    const $nextFieldset = this.querySelector<HTMLFieldSetElement>(':scope > fieldset');

    if (!$nextFieldset && import.meta.env.DEV) {
      console.warn(
        '[rc-segmented-button] No direct child <fieldset> found. Place native radio inputs inside a fieldset.',
        this,
      );
    }

    if ($nextFieldset === this._$fieldset) {
      this._syncInitialValue();
      this._applyValue(false);
      this._applyDisabled();

      return;
    }

    this._$fieldset?.removeEventListener('change', this._handleChange);
    this._$fieldset?.removeEventListener('keydown', this._handleKeyDown);
    this._$fieldset = $nextFieldset;
    this._disabledOwned = false;

    if ($nextFieldset) {
      $nextFieldset.addEventListener('change', this._handleChange);
      $nextFieldset.addEventListener('keydown', this._handleKeyDown);
    }

    this._syncInitialValue();
    this._applyValue(false);
    this._applyDisabled();
  }

  private _syncInitialValue(): void {
    if (this._valueInitialized || this._value) {
      return;
    }

    const $checked = this._$radios.find(($radio) => $radio.checked);

    if ($checked) {
      this._value = $checked.value;
      this._defaultValue = $checked.defaultChecked ? $checked.value : this._defaultValue;
    }
  }

  private get _$radios(): HTMLInputElement[] {
    if (!this._$fieldset) {
      return [];
    }

    return Array.from(
      this._$fieldset.querySelectorAll<HTMLInputElement>(':scope input[type="radio"]'),
    );
  }

  private _$enabledRadios(): HTMLInputElement[] {
    return this._$radios.filter(($radio) => !$radio.disabled && !this.disabled);
  }

  private readonly _handleChange = (event: Event): void => {
    const $target = event.target;

    if (!($target instanceof HTMLInputElement) || $target.type !== 'radio' || !$target.checked) {
      return;
    }

    const oldValue = this.value;

    this._value = $target.value;
    this._valueInitialized = true;
    this.requestUpdate('value', oldValue);

    this.dispatchEvent(
      new CustomEvent<RCSegmentedButtonChangeDetail>('rc-segmented-button-change', {
        bubbles: true,
        composed: true,
        detail: { value: this.value },
      }),
    );
  };

  private readonly _handleKeyDown = (event: KeyboardEvent): void => {
    const $target = event.target;

    if (!($target instanceof HTMLInputElement) || $target.type !== 'radio') {
      return;
    }

    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }

    const forwardKeys =
      this.orientation === 'vertical' ? ['ArrowDown'] : ['ArrowRight', 'ArrowDown'];
    const backwardKeys = this.orientation === 'vertical' ? ['ArrowUp'] : ['ArrowLeft', 'ArrowUp'];
    const $radios = this._$enabledRadios();
    const currentIndex = $radios.indexOf($target);

    if (currentIndex === -1) {
      return;
    }

    let $next: HTMLInputElement | undefined;

    if (forwardKeys.includes(event.key)) {
      $next = $radios[(currentIndex + 1) % $radios.length];
    } else if (backwardKeys.includes(event.key)) {
      $next = $radios[(currentIndex - 1 + $radios.length) % $radios.length];
    } else if (event.key === 'Home') {
      $next = $radios[0];
    } else if (event.key === 'End') {
      $next = $radios[$radios.length - 1];
    }

    if (!$next) {
      return;
    }

    event.preventDefault();
    $next.focus();
    $next.checked = true;
    $next.dispatchEvent(new Event('change', { bubbles: true }));
  };

  private _applyValue(_writeDefault: boolean): void {
    const $radios = this._$radios;
    const value = this.value;

    for (const $radio of $radios) {
      $radio.checked = $radio.value === value;
    }
  }

  private _applyDisabled(): void {
    const $fieldset = this._$fieldset;

    if (!$fieldset) {
      return;
    }

    if (this.disabled) {
      if (!$fieldset.disabled) {
        this._disabledOwned = true;
      }

      $fieldset.disabled = true;
    } else if (this._disabledOwned) {
      $fieldset.disabled = false;
      this._disabledOwned = false;
    }
  }
}

export default RCSegmentedButton;
