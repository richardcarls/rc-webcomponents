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
    display: inline-flex;
    margin: 0;
    padding: 0;
    border: var(--rc-segmented-button-border, 1px solid ButtonBorder);
    border-radius: var(--rc-segmented-button-radius, 9999px);
    overflow: hidden;
  }

  rc-segmented-button[orientation='vertical'] > fieldset {
    flex-direction: column;
  }

  rc-segmented-button > fieldset > label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--rc-segmented-button-segment-gap, 0.5rem);
    min-block-size: var(--rc-segmented-button-segment-min-block-size, 2.5rem);
    padding-block: var(--rc-segmented-button-segment-padding-block, 0);
    padding-inline: var(--rc-segmented-button-segment-padding-inline, 0.75rem);
    color: var(--rc-segmented-button-color, CanvasText);
    background: var(--rc-segmented-button-bg, Canvas);
    cursor: pointer;
    user-select: none;
  }

  rc-segmented-button > fieldset > label + label {
    border-inline-start: var(--rc-segmented-button-divider, 1px solid ButtonBorder);
  }

  rc-segmented-button[orientation='vertical'] > fieldset > label + label {
    border-inline-start: 0;
    border-block-start: var(--rc-segmented-button-divider, 1px solid ButtonBorder);
  }

  rc-segmented-button > fieldset > label:has(input[type='radio']:checked) {
    color: var(--rc-segmented-button-selected-color, Canvas);
    background: var(--rc-segmented-button-selected-bg, CanvasText);
  }

  rc-segmented-button > fieldset > label:has(input[type='radio']:focus-visible) {
    outline: var(--rc-segmented-button-focus-ring, 2px solid Highlight);
    outline-offset: var(--rc-segmented-button-focus-ring-offset, -2px);
  }

  rc-segmented-button > fieldset > label:has(input[type='radio']:disabled),
  rc-segmented-button[disabled] > fieldset > label {
    opacity: var(--rc-segmented-button-disabled-opacity, 0.5);
    cursor: not-allowed;
  }

  rc-segmented-button > fieldset > label > input[type='radio'] {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: 0;
    opacity: 0;
    pointer-events: none;
  }

  rc-segmented-button > fieldset > label > [data-rc-segmented-button-selected-icon] {
    display: none;
  }

  rc-segmented-button > fieldset > label:has(input[type='radio']:checked) > [data-rc-segmented-button-selected-icon] {
    display: inline-grid;
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
  private _fieldset: HTMLFieldSetElement | null = null;
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
    this._fieldset?.removeEventListener('change', this._handleChange);
    this._fieldset?.removeEventListener('keydown', this._handleKeyDown);
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
    const nextFieldset = this.querySelector<HTMLFieldSetElement>(':scope > fieldset');

    if (!nextFieldset && import.meta.env.DEV) {
      console.warn(
        '[rc-segmented-button] No direct child <fieldset> found. Place native radio inputs inside a fieldset.',
        this,
      );
    }

    if (nextFieldset === this._fieldset) {
      this._syncInitialValue();
      this._applyValue(false);
      this._applyDisabled();

      return;
    }

    this._fieldset?.removeEventListener('change', this._handleChange);
    this._fieldset?.removeEventListener('keydown', this._handleKeyDown);
    this._fieldset = nextFieldset;
    this._disabledOwned = false;

    if (nextFieldset) {
      nextFieldset.addEventListener('change', this._handleChange);
      nextFieldset.addEventListener('keydown', this._handleKeyDown);
    }

    this._syncInitialValue();
    this._applyValue(false);
    this._applyDisabled();
  }

  private _syncInitialValue(): void {
    if (this._valueInitialized || this._value) {
      return;
    }

    const checked = this._radios.find((radio) => radio.checked);

    if (checked) {
      this._value = checked.value;
      this._defaultValue = checked.defaultChecked ? checked.value : this._defaultValue;
    }
  }

  private get _radios(): HTMLInputElement[] {
    if (!this._fieldset) {
      return [];
    }

    return Array.from(
      this._fieldset.querySelectorAll<HTMLInputElement>(':scope input[type="radio"]'),
    );
  }

  private _enabledRadios(): HTMLInputElement[] {
    return this._radios.filter((radio) => !radio.disabled && !this.disabled);
  }

  private readonly _handleChange = (event: Event): void => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement) || target.type !== 'radio' || !target.checked) {
      return;
    }

    const oldValue = this.value;

    this._value = target.value;
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
    const target = event.target;

    if (!(target instanceof HTMLInputElement) || target.type !== 'radio') {
      return;
    }

    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
      return;
    }

    const forwardKeys =
      this.orientation === 'vertical' ? ['ArrowDown'] : ['ArrowRight', 'ArrowDown'];
    const backwardKeys = this.orientation === 'vertical' ? ['ArrowUp'] : ['ArrowLeft', 'ArrowUp'];
    const radios = this._enabledRadios();
    const currentIndex = radios.indexOf(target);

    if (currentIndex === -1) {
      return;
    }

    let next: HTMLInputElement | undefined;

    if (forwardKeys.includes(event.key)) {
      next = radios[(currentIndex + 1) % radios.length];
    } else if (backwardKeys.includes(event.key)) {
      next = radios[(currentIndex - 1 + radios.length) % radios.length];
    } else if (event.key === 'Home') {
      next = radios[0];
    } else if (event.key === 'End') {
      next = radios[radios.length - 1];
    }

    if (!next) {
      return;
    }

    event.preventDefault();
    next.focus();
    next.checked = true;
    next.dispatchEvent(new Event('change', { bubbles: true }));
  };

  private _applyValue(_writeDefault: boolean): void {
    const radios = this._radios;
    const value = this.value;

    for (const radio of radios) {
      radio.checked = radio.value === value;
    }
  }

  private _applyDisabled(): void {
    const fieldset = this._fieldset;

    if (!fieldset) {
      return;
    }

    if (this.disabled) {
      if (!fieldset.disabled) {
        this._disabledOwned = true;
      }

      fieldset.disabled = true;
    } else if (this._disabledOwned) {
      fieldset.disabled = false;
      this._disabledOwned = false;
    }
  }
}

export default RCSegmentedButton;
