import { LitElement, html } from 'lit';
import type { PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';

import chipStyles from './rc-chip.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-chip': RCChip;
  }

  interface HTMLElementEventMap {
    'rc-chip-change': CustomEvent<RCChipChangeDetail>;
    'rc-chip-remove': CustomEvent<RCChipRemoveDetail>;
  }
}

const TOGGLE_ROLES = new Set(['checkbox', 'menuitemcheckbox', 'menuitemradio', 'radio', 'switch']);

/** Supported chip variants. */
export type RCChipVariant = 'assist' | 'filter' | 'input' | 'suggestion';

/** Detail payload for `rc-chip-change`. */
export interface RCChipChangeDetail {
  /** Selected state after user interaction. */
  selected: boolean;
}

/** Detail payload for `rc-chip-remove`. */
export interface RCChipRemoveDetail {
  /** The host chip requesting removal. */
  chip: RCChip;
}

/**
 * Chip wrapper that preserves a direct native `<button>` child for interactive
 * chips and accepts a direct `[data-rc-chip-label]` child for read-only chips.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-chip rc-chip docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/button/ WAI-ARIA button pattern}
 *
 * @slot - A direct native `<button>` child, or `[data-rc-chip-label]` when `readonly`.
 * @slot remove-icon - Optional remove affordance icon.
 *
 * @fires rc-chip-change - Fired when a user toggles a filter chip.
 * @fires rc-chip-remove - Fired when a user activates the remove affordance.
 *
 * @csspart state-layer - Overlay layer for hover, focus, pressed, ripple, or design-system effects.
 * @csspart remove - Remove affordance button.
 *
 * @attr variant - Chip variant: `assist`, `filter`, `input`, or `suggestion`.
 * @attr selected - Declarative selected state for filter/input chips.
 * @attr default-selected - Initial selected state for uncontrolled usage.
 * @attr disabled - Mirrors disabled state to the native child button.
 * @attr readonly - Marks the chip as non-interactive display content.
 * @attr removable - Shows a trailing remove affordance.
 * @attr remove-label - Accessible label for the remove affordance.
 */
export class RCChip extends LitElement {
  static override styles = chipStyles;

  private _selected: boolean | undefined;
  private _defaultSelected = false;
  private _selectedInitialized = false;
  private _button: HTMLButtonElement | null = null;
  private _buttonObserver: MutationObserver | null = null;
  private _disabledOwned = false;
  private _pressedOwned = false;
  private _slotMicrotaskQueued = false;

  /** Chip variant. */
  @property({ type: String, reflect: true })
  variant: RCChipVariant = 'assist';

  /** Current selected state. Host writes are silent. */
  @property({ type: Boolean, reflect: true })
  get selected(): boolean {
    return this._selected ?? this._defaultSelected;
  }

  set selected(value: boolean | undefined) {
    const oldValue = this.selected;

    this._selected = value;
    this._selectedInitialized = true;
    this._syncPressedState();
    this.requestUpdate('selected', oldValue);
  }

  /** Initial selected state for uncontrolled usage. */
  @property({ type: Boolean, attribute: 'default-selected' })
  get defaultSelected(): boolean {
    return this._defaultSelected;
  }

  set defaultSelected(value: boolean) {
    const oldValue = this._defaultSelected;

    this._defaultSelected = value;

    if (!this._selectedInitialized && this._selected === undefined) {
      this._syncPressedState();
      this.requestUpdate('selected', oldValue);
    }

    this.requestUpdate('defaultSelected', oldValue);
  }

  /** Mirror disabled state to the native child button. */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Mark this chip as non-interactive display content. */
  @property({ type: Boolean, reflect: true })
  readonly = false;

  /** Show a trailing remove affordance. */
  @property({ type: Boolean, reflect: true })
  removable = false;

  /** Accessible label for the remove affordance. */
  @property({ type: String, attribute: 'remove-label' })
  removeLabel = 'Remove';

  override disconnectedCallback(): void {
    this._button?.removeEventListener('click', this._handleButtonClick);
    this._buttonObserver?.disconnect();
    this._buttonObserver = null;
    super.disconnectedCallback();
  }

  protected override firstUpdated(): void {
    this._syncSlottedButton();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has('disabled') || changed.has('readonly')) {
      this._syncDisabled();
    }

    if (changed.has('variant') || changed.has('selected') || changed.has('readonly')) {
      this._syncPressedState();
    }
  }

  protected override render() {
    return html`
      <slot @slotchange=${this._handleSlotChange}></slot>
      <span part="state-layer" aria-hidden="true"></span>
      ${this.removable
        ? html`
            <button
              part="remove"
              type="button"
              aria-label=${this.removeLabel}
              ?disabled=${this.disabled}
              @click=${this._handleRemoveClick}
            >
              <slot name="remove-icon">×</slot>
            </button>
          `
        : ''}
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
        this._syncSlottedButton();
      }
    });
  }

  private _syncSlottedButton(): void {
    const nextButton = this.querySelector<HTMLButtonElement>(':scope > button');

    if (!nextButton && !this.readonly && import.meta.env.DEV) {
      console.warn(
        '[rc-chip] No direct child <button> found. Place a native <button> inside <rc-chip>, or use readonly with a [data-rc-chip-label] child.',
        this,
      );
    }

    if (nextButton === this._button) {
      this._syncDisabled();
      this._syncPressedState();

      return;
    }

    this._button?.removeEventListener('click', this._handleButtonClick);
    this._buttonObserver?.disconnect();
    this._buttonObserver = null;
    this._button = nextButton;
    this._disabledOwned = false;
    this._pressedOwned = false;

    if (nextButton) {
      nextButton.addEventListener('click', this._handleButtonClick);

      this._buttonObserver = new MutationObserver(() => {
        this._syncDisabled();
        this._syncPressedState();
      });

      this._buttonObserver.observe(nextButton, {
        attributeFilter: ['aria-pressed', 'role', 'disabled'],
      });
    }

    this._syncDisabled();
    this._syncPressedState();
  }

  private readonly _handleButtonClick = (): void => {
    if (this.disabled || this.readonly || this.variant !== 'filter') {
      return;
    }

    const oldValue = this.selected;

    this._selected = !this.selected;
    this._selectedInitialized = true;
    this._syncPressedState();
    this.requestUpdate('selected', oldValue);

    this.dispatchEvent(
      new CustomEvent<RCChipChangeDetail>('rc-chip-change', {
        bubbles: true,
        composed: true,
        detail: { selected: this.selected },
      }),
    );
  };

  private _handleRemoveClick(event: MouseEvent): void {
    event.stopPropagation();

    if (this.disabled || this.readonly || !this.removable) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent<RCChipRemoveDetail>('rc-chip-remove', {
        bubbles: true,
        composed: true,
        detail: { chip: this },
      }),
    );
  }

  private _syncDisabled(): void {
    const button = this._button;

    if (!button) {
      return;
    }

    if (this.disabled || this.readonly) {
      if (!button.disabled) {
        this._disabledOwned = true;
      }

      button.disabled = true;
    } else if (this._disabledOwned) {
      button.disabled = false;
      this._disabledOwned = false;
    }
  }

  private _syncPressedState(): void {
    const button = this._button;

    if (!button) {
      return;
    }

    const role = button.getAttribute('role');
    const authorOwnsState =
      (button.hasAttribute('aria-pressed') && !this._pressedOwned) ||
      (role ? TOGGLE_ROLES.has(role) : false);

    if (!this.readonly && this.variant === 'filter' && !authorOwnsState) {
      const pressed = this.selected ? 'true' : 'false';

      if (button.getAttribute('aria-pressed') !== pressed) {
        button.setAttribute('aria-pressed', pressed);
      }

      this._pressedOwned = true;
    } else if (this._pressedOwned) {
      button.removeAttribute('aria-pressed');
      this._pressedOwned = false;
    }
  }
}

export default RCChip;
