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
 * @slot remove-icon - Optional presentational remove icon.
 *
 * @fires rc-chip-change - Fired when a user toggles a filter chip.
 * @fires rc-chip-remove - Fired when a user activates a removable chip's native button.
 *
 * @csspart state-layer - Overlay layer for hover, focus, pressed, ripple, or design-system effects.
 * @csspart remove - Presentational trailing remove indicator.
 *
 * @cssprop [--rc-chip-gap=0px] - Gap between the slotted button/anchor/label's content.
 * @cssprop [--rc-chip-block-size] - Minimum chip block size (defers to native button/anchor
 *   sizing when unset).
 * @cssprop [--rc-chip-padding-block] - Block-axis padding of the slotted button, anchor, or
 *   label (defers to native padding when unset).
 * @cssprop [--rc-chip-padding-inline] - Inline-axis padding of the slotted button, anchor, or
 *   label (defers to native padding when unset).
 * @cssprop [--rc-chip-border] - Border of the slotted button, anchor, or label (defers to
 *   native border when unset).
 * @cssprop [--rc-chip-radius] - Border radius of the slotted button/anchor/label and the
 *   state-layer overlay (defers to native border-radius when unset; the state-layer overlay
 *   falls back to 0).
 * @cssprop [--rc-chip-bg] - Background of the slotted button, anchor, or label (defers to
 *   native background when unset).
 * @cssprop [--rc-chip-color] - Text color of the slotted button, anchor, or label (defers to
 *   native color when unset).
 * @cssprop [--rc-chip-font] - Font shorthand for the slotted button, anchor, or label (defers
 *   to native font when unset).
 * @cssprop [--rc-chip-text-decoration] - Text decoration for the slotted anchor (defers to
 *   native text-decoration when unset).
 * @cssprop [--rc-chip-selected-border-color] - Border color when `selected` (defers to native
 *   styling when unset).
 * @cssprop [--rc-chip-selected-bg] - Background when `selected` (defers to native styling when
 *   unset).
 * @cssprop [--rc-chip-selected-color] - Text color when `selected` (defers to native styling
 *   when unset).
 * @cssprop [--rc-chip-disabled-opacity] - Opacity of the slotted button when `disabled` (defers
 *   to native disabled styling when unset).
 * @cssprop [--rc-chip-focus-ring] - Outline shown while focus-within (defers to native focus
 *   styling when unset).
 * @cssprop [--rc-chip-focus-ring-offset] - Outline offset while focus-within (defers to native
 *   focus styling when unset).
 * @cssprop [--rc-chip-state-layer-color=currentColor] - Hover/focus/pressed state-layer color.
 * @cssprop [--rc-chip-selected-state-layer-color=var(--rc-chip-state-layer-color, currentColor)] - Selected chip state-layer color.
 * @cssprop [--rc-chip-hover-state-layer-opacity=0.08] - Hover state-layer opacity.
 * @cssprop [--rc-chip-focus-state-layer-opacity=0.12] - Focus state-layer opacity.
 * @cssprop [--rc-chip-pressed-state-layer-opacity=0.12] - Pressed state-layer opacity.
 * @cssprop [--rc-chip-state-layer-transition-duration=var(--rc-motion-effects-duration-fast,80ms)] - State-layer effects duration.
 * @cssprop [--rc-chip-state-layer-transition-easing=var(--rc-motion-effects-easing-fast,ease-out)] - State-layer effects easing.
 * @cssprop [--rc-chip-remove-offset-inline=0.125rem] - Inline offset of the remove indicator
 *   from the chip edge.
 * @cssprop [--rc-chip-remove-target-size=1.5rem] - Minimum inline and block size of the remove
 *   indicator's hit target.
 * @cssprop [--rc-chip-remove-radius=9999px] - Border radius of the remove indicator.
 * @cssprop [--rc-chip-remove-icon-size=smaller] - Font size for a slotted remove icon.
 * @cssprop [--rc-chip-removable-padding-inline-end=calc(var(--rc-chip-remove-target-size, 1.5rem) - var(--rc-chip-gap, 0px))] - Override for removable chip content end padding.
 *
 * @attr variant - Chip variant: `assist`, `filter`, `input`, or `suggestion`.
 * @attr selected - Declarative selected state for filter/input chips.
 * @attr default-selected - Initial selected state for uncontrolled usage.
 * @attr disabled - Mirrors disabled state to the native child button.
 * @attr readonly - Marks the chip as non-interactive display content.
 * @attr removable - Shows a trailing remove affordance.
 */
export class RCChip extends LitElement {
  static override styles = chipStyles;

  private _selected: boolean | undefined;
  private _defaultSelected = false;
  private _selectedInitialized = false;
  private _$button: HTMLButtonElement | null = null;
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

  override disconnectedCallback(): void {
    this._$button?.removeEventListener('click', this._handleButtonClick);
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

    if (
      changed.has('variant') ||
      changed.has('selected') ||
      changed.has('readonly') ||
      changed.has('removable')
    ) {
      this._syncPressedState();
    }
  }

  protected override render() {
    return html`
      <slot @slotchange=${this._handleSlotChange}></slot>
      <span part="state-layer" aria-hidden="true"></span>
      ${this.removable
        ? html`
            <span part="remove" aria-hidden="true">
              <slot name="remove-icon">×</slot>
            </span>
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
    const $nextButton = this.querySelector<HTMLButtonElement>(':scope > button');

    if (!$nextButton && !this.readonly && import.meta.env.DEV) {
      console.warn(
        '[rc-chip] No direct child <button> found. Place a native <button> inside <rc-chip>, or use readonly with a [data-rc-chip-label] child.',
        this,
      );
    }

    if ($nextButton === this._$button) {
      this._syncDisabled();
      this._syncPressedState();

      return;
    }

    this._$button?.removeEventListener('click', this._handleButtonClick);
    this._buttonObserver?.disconnect();
    this._buttonObserver = null;
    this._$button = $nextButton;
    this._disabledOwned = false;
    this._pressedOwned = false;

    if ($nextButton) {
      $nextButton.addEventListener('click', this._handleButtonClick);

      this._buttonObserver = new MutationObserver(() => {
        this._syncDisabled();
        this._syncPressedState();
      });

      this._buttonObserver.observe($nextButton, {
        attributeFilter: ['aria-pressed', 'role', 'disabled'],
      });
    }

    this._syncDisabled();
    this._syncPressedState();
  }

  private readonly _handleButtonClick = (): void => {
    if (this.disabled || this.readonly) {
      return;
    }

    if (this.removable) {
      this._dispatchRemove();

      return;
    }

    if (this.variant !== 'filter') {
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

  private _dispatchRemove(): void {
    this.dispatchEvent(
      new CustomEvent<RCChipRemoveDetail>('rc-chip-remove', {
        bubbles: true,
        composed: true,
        detail: { chip: this },
      }),
    );
  }

  private _syncDisabled(): void {
    const $button = this._$button;

    if (!$button) {
      return;
    }

    if (this.disabled || this.readonly) {
      if (!$button.disabled) {
        this._disabledOwned = true;
      }

      $button.disabled = true;
    } else if (this._disabledOwned) {
      $button.disabled = false;
      this._disabledOwned = false;
    }
  }

  private _syncPressedState(): void {
    const $button = this._$button;

    if (!$button) {
      return;
    }

    const role = $button.getAttribute('role');
    const authorOwnsState =
      ($button.hasAttribute('aria-pressed') && !this._pressedOwned) ||
      (role ? TOGGLE_ROLES.has(role) : false);

    if (!this.readonly && !this.removable && this.variant === 'filter' && !authorOwnsState) {
      const pressed = this.selected ? 'true' : 'false';

      if ($button.getAttribute('aria-pressed') !== pressed) {
        $button.setAttribute('aria-pressed', pressed);
      }

      this._pressedOwned = true;
    } else if (this._pressedOwned) {
      $button.removeAttribute('aria-pressed');
      this._pressedOwned = false;
    }
  }
}

export default RCChip;
