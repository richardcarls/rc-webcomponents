import { LitElement, html } from 'lit';
import type { PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';

import switchStyles from './rc-switch.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-switch': RCSwitch;
  }

  interface HTMLElementEventMap {
    'rc-switch-change': CustomEvent<RCSwitchChangeDetail>;
  }
}

/** Detail payload for `rc-switch-change`. */
export interface RCSwitchChangeDetail {
  /** Current checked state after user interaction. */
  checked: boolean;
}

/**
 * Switch wrapper that enhances a direct native checkbox input.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-switch rc-switch docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/switch/ WAI-ARIA switch pattern}
 *
 * @slot - A direct native `<input type="checkbox">` child.
 *
 * @fires rc-switch-change - Fired after user interaction changes the checked state.
 *
 * @csspart track - Visual switch track.
 * @csspart thumb - Visual switch thumb.
 * @csspart selected-icon - Optional selected-state icon container.
 * @csspart deselected-icon - Optional deselected-state icon container.
 *
 * @attr checked - Current checked state. Host writes are silent.
 * @attr default-checked - Initial checked state for uncontrolled usage.
 * @attr disabled - Mirrors disabled state to the native checkbox.
 * @attr icons - Shows both selected and deselected icon containers.
 * @attr show-only-selected-icon - Shows only the selected icon container.
 */
export class RCSwitch extends LitElement {
  static override styles = switchStyles;

  private _checked: boolean | undefined;
  private _defaultChecked = false;
  private _checkedInitialized = false;
  private _input: HTMLInputElement | null = null;
  private _inputObserver: MutationObserver | null = null;
  private _form: HTMLFormElement | null = null;
  private _roleOwned = false;
  private _disabledOwned = false;
  private _slotMicrotaskQueued = false;

  /** Current checked state. Host writes are silent. */
  @property({ type: Boolean, reflect: true })
  get checked(): boolean {
    return this._checked ?? this._defaultChecked;
  }

  set checked(value: boolean | undefined) {
    const oldValue = this.checked;

    this._checked = value;
    this._checkedInitialized = true;
    this._applyChecked(false);
    this.requestUpdate('checked', oldValue);
  }

  /** Initial checked state for uncontrolled usage. */
  @property({ type: Boolean, attribute: 'default-checked' })
  get defaultChecked(): boolean {
    return this._defaultChecked;
  }

  set defaultChecked(value: boolean) {
    const oldValue = this._defaultChecked;

    this._defaultChecked = value;

    if (!this._checkedInitialized && this._checked === undefined) {
      this._applyChecked(false);
      this.requestUpdate('checked', oldValue);
    }

    this.requestUpdate('defaultChecked', oldValue);
  }

  /** Mirror disabled state to the native checkbox. */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Show selected and deselected icon affordance containers. */
  @property({ type: Boolean, reflect: true })
  icons = false;

  /** Show only the selected icon affordance container. */
  @property({ type: Boolean, attribute: 'show-only-selected-icon', reflect: true })
  showOnlySelectedIcon = false;

  override disconnectedCallback(): void {
    this._inputObserver?.disconnect();
    this._inputObserver = null;
    this._setForm(null);
    super.disconnectedCallback();
  }

  protected override firstUpdated(): void {
    this._syncNativeInput();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has('disabled')) {
      this._applyDisabled();
    }
  }

  protected override render() {
    return html`
      <span part="track" aria-hidden="true"></span>
      <span part="thumb" aria-hidden="true"></span>
      <span part="selected-icon" aria-hidden="true"><slot name="selected-icon">✓</slot></span>
      <span part="deselected-icon" aria-hidden="true"><slot name="deselected-icon">–</slot></span>
      <slot @slotchange=${this._handleSlotChange}></slot>
    `;
  }

  private _handleSlotChange(): void {
    if (this._slotMicrotaskQueued) {
      return;
    }

    this._slotMicrotaskQueued = true;

    queueMicrotask(() => {
      this._slotMicrotaskQueued = false;

      if (this.isConnected) {
        this._syncNativeInput();
      }
    });
  }

  private _syncNativeInput(): void {
    const nextInput = this.querySelector<HTMLInputElement>(':scope > input[type="checkbox"]');

    if (!nextInput && import.meta.env.DEV) {
      console.warn(
        '[rc-switch] No direct child <input type="checkbox"> found. Place a native checkbox inside <rc-switch>.',
        this,
      );
    }

    if (nextInput === this._input) {
      this._applyNativeSemantics();
      this._applyChecked(false);
      this._applyDisabled();

      return;
    }

    this._input?.removeEventListener('change', this._handleNativeChange);
    this._inputObserver?.disconnect();
    this._inputObserver = null;
    this._input = nextInput;
    this._roleOwned = false;
    this._disabledOwned = false;
    this._setForm(nextInput?.form ?? null);

    if (nextInput) {
      if (!this._checkedInitialized && this._checked === undefined) {
        this._defaultChecked = nextInput.defaultChecked || nextInput.checked;
        this._checked = nextInput.checked;
      }

      nextInput.addEventListener('change', this._handleNativeChange);

      this._inputObserver = new MutationObserver(() => {
        this._applyNativeSemantics();
        this._syncFromNative();
      });

      this._inputObserver.observe(nextInput, {
        attributeFilter: ['checked', 'disabled', 'role'],
      });
    }

    this._applyNativeSemantics();
    this._applyChecked(false);
    this._applyDisabled();
  }

  private readonly _handleNativeChange = (): void => {
    this._syncFromNative();

    this.dispatchEvent(
      new CustomEvent<RCSwitchChangeDetail>('rc-switch-change', {
        bubbles: true,
        composed: true,
        detail: { checked: this.checked },
      }),
    );
  };

  private _syncFromNative(): void {
    const input = this._input;

    if (!input) {
      return;
    }

    const oldValue = this.checked;

    this._checked = input.checked;
    this._checkedInitialized = true;
    this.toggleAttribute('checked', input.checked);
    this.requestUpdate('checked', oldValue);
  }

  private _applyNativeSemantics(): void {
    const input = this._input;

    if (!input) {
      return;
    }

    if (!input.hasAttribute('role')) {
      input.setAttribute('role', 'switch');
      this._roleOwned = true;
    } else if (this._roleOwned && input.getAttribute('role') !== 'switch') {
      this._roleOwned = false;
    }
  }

  private _applyChecked(writeDefault: boolean): void {
    const input = this._input;

    if (!input) {
      this.toggleAttribute('checked', this.checked);

      return;
    }

    input.checked = this.checked;

    if (writeDefault) {
      input.defaultChecked = this._defaultChecked;
    }

    this.toggleAttribute('checked', input.checked);
  }

  private _applyDisabled(): void {
    const input = this._input;

    if (!input) {
      return;
    }

    if (this.disabled) {
      if (!input.disabled) {
        this._disabledOwned = true;
      }

      input.disabled = true;
    } else if (this._disabledOwned) {
      input.disabled = false;
      this._disabledOwned = false;
    }
  }

  private _setForm(form: HTMLFormElement | null): void {
    this._form?.removeEventListener('reset', this._handleFormReset);
    this._form = form;
    this._form?.addEventListener('reset', this._handleFormReset);
  }

  private readonly _handleFormReset = (): void => {
    queueMicrotask(() => this._syncFromNative());
  };
}

export default RCSwitch;
