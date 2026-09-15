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

const LIGHT_DOM_CSS = `
@layer rc-base {
  rc-chip > :is(button, a, label, [data-rc-chip-label]) {
    position: relative;
    display: inline-flex;
    box-sizing: border-box;
    align-items: center;
    justify-content: center;
    gap: var(--rc-chip-gap, 0px);
    min-block-size: var(--rc-chip-block-size, revert);
    margin: 0;
    padding-block: var(--rc-chip-padding-block, revert);
    padding-inline-start: var(
      --rc-chip-padding-inline-start,
      var(--rc-chip-padding-inline, revert)
    );
    padding-inline-end: var(--rc-chip-padding-inline-end, var(--rc-chip-padding-inline, revert));
    border: var(--rc-chip-border, revert);
    border-radius: var(--rc-chip-radius, revert);
    background: var(--rc-chip-bg, revert);
    color: var(--rc-chip-color, revert);
    font: var(--rc-chip-font, revert);
    text-decoration: var(--rc-chip-text-decoration, revert);
    white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
  }

  rc-chip:not([readonly]) > :is(button, a, label)::before {
    content: '';
    position: absolute;
    z-index: 1;
    inset-block: calc(
      (var(--rc-chip-touch-target-block-size, 3rem) - max(100%, var(--rc-chip-block-size, 0px))) /
        -2
    );
    inset-inline: 0;
    border-radius: inherit;
  }

  rc-chip[selected] > :is(button, a, label, [data-rc-chip-label]),
  rc-chip > label:has(> input:is([type='checkbox'], [type='radio']):checked) {
    border-color: var(--rc-chip-selected-border-color, revert);
    background: var(--rc-chip-selected-bg, revert);
    color: var(--rc-chip-selected-color, revert);
  }

  rc-chip[disabled] > :is(button, label),
  rc-chip > label:has(> input:is([type='checkbox'], [type='radio']):disabled) {
    opacity: var(--rc-chip-disabled-opacity, revert);
  }

  rc-chip > :is(button, a):focus-visible,
  rc-chip > label:has(> input:is([type='checkbox'], [type='radio']):focus-visible) {
    outline: var(--rc-chip-focus-ring, revert);
    outline-offset: var(--rc-chip-focus-ring-offset, revert);
  }

  rc-chip > label > input:is([type='checkbox'], [type='radio']) {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  rc-chip[removable] > :is(button, a, label, [data-rc-chip-label]) {
    padding-inline-end: var(
      --rc-chip-removable-padding-inline-end,
      calc(
        var(--rc-chip-remove-target-size, 1.5rem) +
          var(--rc-chip-remove-offset-inline, 0.125rem)
      )
    );
  }

  @media (forced-colors: active) {
    rc-chip > :is(button, a, label, [data-rc-chip-label]) {
      border-color: ButtonBorder;
      background: ButtonFace;
      color: ButtonText;
    }

    rc-chip[selected] > :is(button, a, label, [data-rc-chip-label]),
    rc-chip > label:has(> input:is([type='checkbox'], [type='radio']):checked) {
      border-color: Highlight;
      background: Highlight;
      color: HighlightText;
    }
  }
}
`;

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
 * Chip wrapper that preserves a direct native `<button>` child for action chips,
 * a direct `<a href>` for navigation chips, or a direct `<label>` containing a
 * native checkbox/radio for filter chips. Read-only chips accept a direct
 * `[data-rc-chip-label]` child.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-chip rc-chip docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/button/ WAI-ARIA button pattern}
 *
 * @slot - A direct native `<button>` child, `<a href>`, native-backed filter
 *   `<label>`, or `[data-rc-chip-label]` when `readonly`.
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
 * @cssprop [--rc-chip-touch-target-block-size=3rem] - Minimum interactive touch target size.
 * @cssprop [--rc-chip-touch-target-overlap-block-start=0px] - Zero by default. A theme or
 *   consumer sets this on a chip that sits at a real block-axis leading edge (no neighbor on
 *   that side), such as inside a height-constrained field, to let its touch-target inflation
 *   overlap into whatever sits just outside the host instead of also reserving layout space
 *   there.
 * @cssprop [--rc-chip-touch-target-overlap-block-end=0px] - The block-axis trailing-edge
 *   counterpart to `--rc-chip-touch-target-overlap-block-start`.
 * @cssprop [--rc-chip-padding-block] - Block-axis padding of the slotted button, anchor, or
 *   label (defers to native padding when unset).
 * @cssprop [--rc-chip-padding-inline] - Inline-axis padding of the slotted button, anchor, or
 *   label (defers to native padding when unset).
 * @cssprop [--rc-chip-padding-inline-start=var(--rc-chip-padding-inline)] - Logical leading
 *   padding of the slotted button, anchor, or label.
 * @cssprop [--rc-chip-padding-inline-end=var(--rc-chip-padding-inline)] - Logical trailing
 *   padding of the slotted button, anchor, or label.
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
 * @cssprop [--rc-chip-removable-padding-inline-end=calc(var(--rc-chip-remove-target-size, 1.5rem) + var(--rc-chip-remove-offset-inline, 0.125rem))] - Override for removable chip content end padding.
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

  private static readonly _styledRoots = new WeakSet<Document | ShadowRoot>();

  private static _ensureBaseStyles(root: Document | ShadowRoot): void {
    if (RCChip._styledRoots.has(root)) {
      return;
    }

    RCChip._styledRoots.add(root);

    const $style = (root instanceof Document ? root : root.ownerDocument).createElement('style');

    $style.setAttribute('data-rc-light-dom-base', 'rc-chip');
    $style.textContent = LIGHT_DOM_CSS;

    if (root instanceof Document) {
      root.head.append($style);
    } else {
      root.append($style);
    }
  }

  private _selected: boolean | undefined;
  private _defaultSelected = false;
  private _uncontrolledSelected: boolean | undefined;
  private _selectedInitialized = false;
  private _$button: HTMLButtonElement | null = null;
  private _$input: HTMLInputElement | null = null;
  private _$form: HTMLFormElement | null = null;
  private _controlObserver: MutationObserver | null = null;
  private _disabledOwned = false;
  private _pressedOwned = false;
  private _slotMicrotaskQueued = false;
  private _lastChildWarning: string | null = null;

  /** Chip variant. */
  @property({ type: String, reflect: true })
  variant: RCChipVariant = 'assist';

  /** Current selected state. Host writes are silent. */
  @property({ type: Boolean, reflect: true })
  get selected(): boolean {
    return this._selected ?? this._uncontrolledSelected ?? this._defaultSelected;
  }

  set selected(value: boolean | undefined) {
    const oldValue = this.selected;

    this._selected = value;
    this._selectedInitialized = true;
    this._syncCheckedState();
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

    if (
      !this._selectedInitialized &&
      this._selected === undefined &&
      this._uncontrolledSelected === undefined
    ) {
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

  override connectedCallback(): void {
    super.connectedCallback();
    RCChip._ensureBaseStyles(this.getRootNode() as Document | ShadowRoot);
  }

  override disconnectedCallback(): void {
    this._$button?.removeEventListener('click', this._handleButtonClick);
    this._$input?.removeEventListener('change', this._handleNativeChange);
    this._$form?.removeEventListener('reset', this._handleFormReset);
    this._controlObserver?.disconnect();
    this._controlObserver = null;
    super.disconnectedCallback();
  }

  /** Synchronizes uncontrolled filter state from the direct native input. @internal */
  syncNativeSelection(): void {
    this._syncCheckedFromNative();
  }

  protected override firstUpdated(): void {
    this._syncSlottedButton(true);
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

    if (changed.has('selected')) {
      this._syncCheckedState();
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

  private _syncSlottedButton(deferInitialSelectionUpdate = false): void {
    const $nextButton = this.querySelector<HTMLButtonElement>(':scope > button');
    const $anchor = this.querySelector<HTMLAnchorElement>(':scope > a[href]');
    const $label = this.querySelector<HTMLLabelElement>(':scope > label');
    const $nextInput =
      $label?.querySelector<HTMLInputElement>(
        ':scope > input:is([type="checkbox"], [type="radio"])',
      ) ?? null;

    if (import.meta.env.DEV) {
      let childWarning: string | null = null;

      if (!$nextButton && !$anchor && !$label && !this.readonly) {
        childWarning =
          '[rc-chip] No supported direct child found. Place a native <button>, <a href>, or a <label> containing a direct checkbox/radio inside <rc-chip>, or use readonly with a [data-rc-chip-label] child.';
      } else if ($label && !$nextInput && !this.readonly) {
        childWarning =
          '[rc-chip] A direct child <label> must contain a direct <input type="checkbox"> or <input type="radio">.';
      }

      if (childWarning && childWarning !== this._lastChildWarning) {
        console.warn(childWarning);
      }

      this._lastChildWarning = childWarning;
    }

    if ($nextButton === this._$button && $nextInput === this._$input) {
      this._syncDisabled();
      this._syncCheckedState();
      this._syncPressedState();

      return;
    }

    this._$button?.removeEventListener('click', this._handleButtonClick);
    this._$input?.removeEventListener('change', this._handleNativeChange);
    this._$form?.removeEventListener('reset', this._handleFormReset);
    this._controlObserver?.disconnect();
    this._controlObserver = null;
    this._$button = $nextButton;
    this._$input = $nextInput;
    this._$form = $nextInput?.form ?? null;
    this._disabledOwned = false;
    this._pressedOwned = false;

    if ($nextButton) {
      $nextButton.addEventListener('click', this._handleButtonClick);
    }

    if ($nextInput) {
      if (this._selected === undefined && this._uncontrolledSelected === undefined) {
        const oldValue = this.selected;

        this._uncontrolledSelected = $nextInput.checked;
        this._selectedInitialized = true;

        if (deferInitialSelectionUpdate) {
          queueMicrotask(() => this.requestUpdate('selected', oldValue));
        } else {
          this.requestUpdate('selected', oldValue);
        }
      } else {
        this._syncCheckedState();
      }

      $nextInput.addEventListener('change', this._handleNativeChange);
      this._$form?.addEventListener('reset', this._handleFormReset);
    }

    const $observedControl = $nextInput ?? $nextButton;

    if ($observedControl) {
      this._controlObserver = new MutationObserver(() => {
        this._syncDisabled();
        this._syncCheckedFromNative();
        this._syncPressedState();
      });

      this._controlObserver.observe($observedControl, {
        attributeFilter: ['aria-pressed', 'role', 'disabled', 'checked'],
      });
    }

    this._syncDisabled();
    this._syncCheckedState();
    this._syncPressedState();
  }

  private readonly _handleNativeChange = (): void => {
    const $input = this._$input;

    if (!$input || this.disabled || this.readonly) {
      return;
    }

    const oldValue = this.selected;
    const requestedSelected = $input.checked;

    if (this._selected === undefined) {
      this._uncontrolledSelected = requestedSelected;
      this._selectedInitialized = true;
      this.requestUpdate('selected', oldValue);
    } else {
      this._syncCheckedState();
    }

    this.dispatchEvent(
      new CustomEvent<RCChipChangeDetail>('rc-chip-change', {
        bubbles: true,
        composed: true,
        detail: { selected: requestedSelected },
      }),
    );
  };

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

    // Menu-backed filter chips expose filter affordance, but their menu owns
    // the eventual selected state. Preserve that author-controlled behavior.
    const hasPopup = this._$button?.getAttribute('aria-haspopup');

    if (hasPopup && hasPopup !== 'false') {
      return;
    }

    const oldValue = this.selected;
    const requestedSelected = !oldValue;

    if (this._selected === undefined) {
      this._uncontrolledSelected = requestedSelected;
      this._selectedInitialized = true;
      this._syncPressedState();
      this.requestUpdate('selected', oldValue);
    }

    this.dispatchEvent(
      new CustomEvent<RCChipChangeDetail>('rc-chip-change', {
        bubbles: true,
        composed: true,
        detail: { selected: requestedSelected },
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
    const $control = this._$input ?? this._$button;

    if (!$control) {
      return;
    }

    if (this.disabled || this.readonly) {
      if (!$control.disabled) {
        this._disabledOwned = true;
      }

      $control.disabled = true;
    } else if (this._disabledOwned) {
      $control.disabled = false;
      this._disabledOwned = false;
    }
  }

  private _syncCheckedState(): void {
    const $input = this._$input;

    if ($input && $input.checked !== this.selected) {
      $input.checked = this.selected;
    }
  }

  private _syncCheckedFromNative(): void {
    const $input = this._$input;

    if (!$input || $input.checked === this.selected) {
      return;
    }

    const oldValue = this.selected;

    if (this._selected === undefined) {
      this._uncontrolledSelected = $input.checked;
      this._selectedInitialized = true;
      this.requestUpdate('selected', oldValue);
    } else {
      this._syncCheckedState();
    }
  }

  private readonly _handleFormReset = (): void => {
    queueMicrotask(() => this._syncCheckedFromNative());
  };

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
