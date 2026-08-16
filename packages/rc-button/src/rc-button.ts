import { LitElement, html } from 'lit';
import type { PropertyValues } from 'lit';
import { property, query } from 'lit/decorators.js';

import buttonStyles from './rc-button.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-button': RCButton;
  }

  interface HTMLElementEventMap {
    'rc-button-toggle': CustomEvent<RCButtonToggleDetail>;
  }
}

const LIGHT_DOM_CSS = `
@layer rc-base {
  /*
   * Icon-font utility classes commonly set display outside cascade layers.
   * Hiding the inactive icon is structural, so it must win that declaration.
   */
  rc-button[selected] > button > [data-rc-button-icon] {
    display: none !important;
  }

  rc-button:not([selected]) > button > [data-rc-button-selected-icon] {
    display: none !important;
  }
}
`;

const ACTIVATION_KEYS = new Set(['Enter', ' ']);

/** Detail payload for `rc-button-toggle`. */
export interface RCButtonToggleDetail {
  /** Requested selected state after user activation. */
  selected: boolean;
}

/**
 * Structural button wrapper that preserves a direct native `<button>` child for
 * progressive enhancement, forms, labels, and keyboard behavior.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-button rc-button docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/button/ WAI-ARIA button pattern}
 *
 * @slot - A direct native `<button>` child.
 *
 * @fires rc-button-toggle - Fired when a user activates a button with `toggle`.
 *
 * @csspart state-layer - Overlay layer for hover, focus, pressed, ripple, or design-system effects.
 * @csspart progress - Non-interactive progress affordance overlay shown for `pending` or `progress`.
 *
 * @attr disabled - Mirrors disabled state to the native child button.
 * @attr pending - Disables the native button and exposes an indeterminate progress affordance.
 * @attr progress - Disables the native button and exposes a progress affordance.
 * @attr progress-value - Optional determinate progress percentage, clamped from 0 through 100.
 * @attr toggle - Opts the native child into APG toggle-button behavior.
 * @attr selected - Controlled selected state for toggle semantics, styling, and icon switching.
 * @attr default-selected - Initial selected state for uncontrolled toggle usage.
 * @attr icon-only - Removes label-oriented inline padding in supporting themes.
 * @attr full-width - Stretches the native child button to the host inline size.
 * @attr [has-icon] - Present when the native button has a direct `[data-rc-button-icon]` child.
 *   Use with CSS selectors (e.g. `rc-button[has-icon]`).
 * @attr [has-selected-icon] - Present when the native button has a direct
 *   `[data-rc-button-selected-icon]` child.
 * @attr [has-label] - Present when the native button has visible label content, from either a
 *   `[data-rc-button-label]` child or bare text.
 *
 * @cssprop [--rc-button-gap] - Gap between icon and label content.
 * @cssprop [--rc-button-block-size] - Minimum button block size.
 * @cssprop [--rc-button-min-inline-size] - Minimum button inline size.
 * @cssprop [--rc-button-inline-size] - Button inline size.
 * @cssprop [--rc-button-padding-block] - Button block-axis padding (defers to native button
 *   padding when unset).
 * @cssprop [--rc-button-padding-inline] - Button inline-axis padding (defers to native button
 *   padding when unset).
 * @cssprop [--rc-button-border] - Button border (defers to native button border when unset).
 * @cssprop [--rc-button-radius] - Button and overlay border radius (defers to native button
 *   radius when unset).
 * @cssprop [--rc-button-bg] - Button background (defers to native button background when unset).
 * @cssprop [--rc-button-color] - Button text color (defers to native button color when unset).
 * @cssprop [--rc-button-shadow] - Button box shadow (defers to native button shadow when unset).
 * @cssprop [--rc-button-font] - Button font shorthand (defers to native button font when unset).
 * @cssprop [--rc-button-transition] - Button transition shorthand (defers to native button
 *   transition when unset).
 * @cssprop [--rc-button-icon-size] - Button inline and min-inline size when `icon-only`. Falls
 *   back to `--rc-button-block-size`, then `--rc-control-block-size`, then `2.5rem`.
 * @cssprop [--rc-button-disabled-opacity] - Disabled button opacity (defers to native disabled
 *   styling when unset).
 * @cssprop [--rc-button-busy-content-color=transparent] - Button text color while `pending` or
 *   `progress`.
 * @cssprop [--rc-button-state-layer-bg=currentColor] - State-layer overlay color.
 * @cssprop [--rc-button-state-layer-duration=150ms] - State-layer opacity transition duration.
 * @cssprop [--rc-button-state-layer-easing=ease] - State-layer opacity transition easing.
 * @cssprop [--rc-button-hover-state-layer-opacity=0] - State-layer opacity on hover.
 * @cssprop [--rc-button-focus-state-layer-opacity=0] - State-layer opacity on focus-within.
 * @cssprop [--rc-button-pressed-state-layer-opacity=0] - State-layer opacity on active press.
 * @cssprop [--rc-button-progress-color=currentColor] - Progress affordance color.
 * @cssprop [--rc-button-progress-font=600 0.75rem / 1 sans-serif] - Determinate progress
 *   percentage font.
 * @cssprop [--rc-button-progress-size=1.25rem] - Indeterminate progress spinner diameter.
 * @cssprop [--rc-button-progress-track-width=2px] - Indeterminate progress spinner stroke width.
 * @cssprop [--rc-button-progress-track-color=color-mix(in srgb, currentColor 24%, transparent)] -
 *   Indeterminate progress spinner track color.
 * @cssprop [--rc-button-progress-active-color=currentColor] - Indeterminate progress spinner
 *   active arc color.
 */
export class RCButton extends LitElement {
  static override styles = buttonStyles;

  protected static readonly _styledRoots = new Set<Document | ShadowRoot>();

  protected static _ensureBaseStyles(root: Document | ShadowRoot): void {
    if (RCButton._styledRoots.has(root)) {
      return;
    }

    RCButton._styledRoots.add(root);

    const style = document.createElement('style');

    style.setAttribute('data-rc-light-dom-base', 'rc-button');
    style.textContent = LIGHT_DOM_CSS;

    if (root instanceof Document) {
      root.head.append(style);
    } else {
      root.append(style);
    }
  }

  /** Mirror disabled state to the native child. */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /** Show an indeterminate progress affordance and disable the native button. */
  @property({ type: Boolean, reflect: true })
  pending = false;

  /** Show a progress affordance and disable the native button. */
  @property({ type: Boolean, reflect: true })
  progress = false;

  /** Optional determinate progress percentage, clamped from 0 through 100. */
  @property({ type: Number, attribute: 'progress-value', reflect: true })
  progressValue: number | undefined;

  /** Opt the native child into APG toggle-button behavior. */
  @property({ type: Boolean, reflect: true })
  toggle = false;

  /** Controlled selected state. Host writes are silent. */
  @property({ type: Boolean, reflect: true })
  get selected(): boolean {
    return this._selected ?? this._uncontrolledSelected ?? this._defaultSelected;
  }

  set selected(value: boolean | undefined) {
    const oldValue = this.selected;

    this._selected = value;
    this._selectedInitialized = true;
    this._syncPressedState();
    this.requestUpdate('selected', oldValue);
  }

  /** Initial selected state for uncontrolled toggle usage. */
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

  /** Icon-only layout hint. May also be reflected by child classification. */
  @property({ type: Boolean, attribute: 'icon-only', reflect: true })
  iconOnly = false;

  /** Stretch the native child button to the host inline size. */
  @property({ type: Boolean, attribute: 'full-width', reflect: true })
  fullWidth = false;

  @query('slot') protected _$slot!: HTMLSlotElement;

  @query('[part="state-layer"]') protected _$stateLayer!: HTMLElement;

  private _selected: boolean | undefined;
  private _defaultSelected = false;
  private _uncontrolledSelected: boolean | undefined;
  private _selectedInitialized = false;
  protected _$button: HTMLButtonElement | null = null;
  protected _buttonObserver: MutationObserver | null = null;
  protected _disabledOwned = false;
  protected _ariaBusyOwned = false;
  protected _pressedOwned = false;
  protected _authorPressed: string | null = null;
  protected _iconOnlyOwned = false;
  protected _slotMicrotaskQueued = false;

  override connectedCallback(): void {
    super.connectedCallback();
    RCButton._ensureBaseStyles(this.getRootNode() as Document | ShadowRoot);
  }

  override disconnectedCallback(): void {
    this._buttonObserver?.disconnect();
    this._buttonObserver = null;
    super.disconnectedCallback();
  }

  protected override firstUpdated(): void {
    this._syncSlottedButton();
  }

  protected override updated(changed: PropertyValues<this>): void {
    if (changed.has('disabled') || changed.has('pending') || changed.has('progress')) {
      this._syncNativeState();
    }

    if (changed.has('toggle') || changed.has('selected')) {
      this._syncPressedState();
    }
  }

  protected override render() {
    const progressPercentage = this._progressPercentage;

    return html`
      <slot @slotchange=${this._handleSlotChange}></slot>
      <span
        part="state-layer"
        aria-hidden="true"
        @animationend=${this._handleRippleAnimationEnd}
      ></span>
      <span part="progress" aria-hidden="true" ?data-determinate=${progressPercentage !== undefined}
        >${progressPercentage === undefined ? '' : `${progressPercentage}%`}</span
      >
    `;
  }

  protected get _progressPercentage(): number | undefined {
    if (!this.progress || !Number.isFinite(this.progressValue)) {
      return undefined;
    }

    return Math.round(Math.min(100, Math.max(0, this.progressValue!)));
  }

  protected _handleSlotChange(): void {
    if (this._slotMicrotaskQueued) {
      return;
    }

    this._slotMicrotaskQueued = true;

    queueMicrotask(() => {
      this._slotMicrotaskQueued = false;

      if (!this.isConnected) {
        return;
      }

      this._syncSlottedButton();
    });
  }

  protected _syncSlottedButton(): void {
    const nextButton =
      this._$slot
        ?.assignedElements({ flatten: true })
        .find(
          (element): element is HTMLButtonElement =>
            element instanceof HTMLButtonElement && element.parentElement === this,
        ) ?? null;

    if (!nextButton && import.meta.env.DEV) {
      const misplaced = this.querySelector(
        ':scope > [data-rc-button-icon], :scope > [data-rc-button-selected-icon], :scope > [data-rc-button-label]',
      );

      console.warn(
        misplaced
          ? '[rc-button] Place icon and label markers inside the direct child <button>; rc-button will not move author nodes.'
          : '[rc-button] No direct child <button> found. Place a native <button> inside <rc-button>.',
      );
    }

    if (nextButton === this._$button) {
      this._classifyButton();
      this._syncNativeState();
      this._syncPressedState();

      return;
    }

    this._restorePressedState();
    this._buttonObserver?.disconnect();
    this._buttonObserver = null;
    this._$button = nextButton;
    this._disabledOwned = false;
    this._ariaBusyOwned = false;
    this._pressedOwned = false;
    this._authorPressed = nextButton?.getAttribute('aria-pressed') ?? null;

    if (nextButton) {
      this._buttonObserver = new MutationObserver(() => {
        this._classifyButton();
        this._syncNativeState();
        this._syncPressedState();
      });

      this._buttonObserver.observe(nextButton, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    this._classifyButton();
    this._syncNativeState();
    this._syncPressedState();
  }

  protected _classifyButton(): void {
    const button = this._$button;
    const hasIcon = !!button?.querySelector(':scope > [data-rc-button-icon]');
    const hasSelectedIcon = !!button?.querySelector(':scope > [data-rc-button-selected-icon]');
    const hasLabel = this._hasLabel(button);

    this.toggleAttribute('has-icon', hasIcon);
    this.toggleAttribute('has-selected-icon', hasSelectedIcon);
    this.toggleAttribute('has-label', hasLabel);

    if (button && hasIcon && !hasLabel) {
      if (!this.iconOnly) {
        this._iconOnlyOwned = true;
        this.iconOnly = true;
      }
    } else if (this._iconOnlyOwned) {
      this._iconOnlyOwned = false;
      this.iconOnly = false;
    }
  }

  protected _hasLabel(button: HTMLButtonElement | null): boolean {
    if (!button) {
      return false;
    }

    if (button.querySelector(':scope > [data-rc-button-label]')) {
      return true;
    }

    for (const node of button.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        return true;
      }

      if (!(node instanceof HTMLElement)) {
        continue;
      }

      // data-rc-button-progress marks consumer content that must not count as a label.
      if (
        node.matches(
          '[data-rc-button-icon], [data-rc-button-selected-icon], [data-rc-button-progress], [aria-hidden="true"]',
        )
      ) {
        continue;
      }

      if (node.textContent?.trim()) {
        return true;
      }
    }

    return false;
  }

  protected _syncNativeState(): void {
    const button = this._$button;

    if (!button) {
      return;
    }

    const shouldDisable = this.disabled || this.pending || this.progress;

    if (shouldDisable && !button.disabled) {
      this._disabledOwned = true;

      // Idempotent disabled writes queue mutation records and re-enter the button observer.
      button.disabled = true;
    } else if (!shouldDisable && this._disabledOwned) {
      button.disabled = false;
      this._disabledOwned = false;
    }

    const busy = this.pending || this.progress;

    if (busy) {
      if (!button.hasAttribute('aria-busy')) {
        button.setAttribute('aria-busy', 'true');
        this._ariaBusyOwned = true;
      }
    } else if (this._ariaBusyOwned) {
      button.removeAttribute('aria-busy');
      this._ariaBusyOwned = false;
    }
  }

  protected _syncPressedState(): void {
    const button = this._$button;

    if (!button) {
      return;
    }

    if (this.toggle) {
      const pressed = this.selected ? 'true' : 'false';

      if (button.getAttribute('aria-pressed') !== pressed) {
        button.setAttribute('aria-pressed', pressed);
      }

      this._pressedOwned = true;
    } else if (this._pressedOwned) {
      this._restorePressedState();
    }
  }

  protected _restorePressedState(): void {
    const button = this._$button;

    if (!button || !this._pressedOwned) {
      return;
    }

    if (this._authorPressed === null) {
      button.removeAttribute('aria-pressed');
    } else {
      button.setAttribute('aria-pressed', this._authorPressed);
    }

    this._pressedOwned = false;
  }

  protected _handleToggleActivation(event: MouseEvent): void {
    if (
      !this.toggle ||
      this.disabled ||
      this.pending ||
      this.progress ||
      event.defaultPrevented ||
      !this._isChildButtonEvent(event)
    ) {
      return;
    }

    const oldValue = this.selected;
    const nextSelected = !oldValue;

    if (this._selected === undefined) {
      this._uncontrolledSelected = nextSelected;
      this._selectedInitialized = true;
      this._syncPressedState();
      this.requestUpdate('selected', oldValue);
    }

    this.dispatchEvent(
      new CustomEvent<RCButtonToggleDetail>('rc-button-toggle', {
        bubbles: true,
        composed: true,
        detail: { selected: nextSelected },
      }),
    );
  }

  protected _shouldBlockActivation(): boolean {
    return this.pending || this.progress;
  }

  protected _isChildButtonEvent(event: Event): boolean {
    return !!this._$button && event.composedPath().includes(this._$button);
  }

  protected _blockActivation(event: Event): void {
    if (!this._shouldBlockActivation() || !this._isChildButtonEvent(event)) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
  }

  protected _startRipple(event: PointerEvent): void {
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      this.disabled ||
      this.pending ||
      this.progress ||
      !this._isChildButtonEvent(event) ||
      !this._$stateLayer ||
      getComputedStyle(this).getPropertyValue('--_rc-button-ripple-enabled').trim() !== '1'
    ) {
      return;
    }

    const bounds = this._$button!.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const radius = Math.hypot(Math.max(x, bounds.width - x), Math.max(y, bounds.height - y));

    this._$stateLayer.style.setProperty('--_rc-button-ripple-x', `${x}px`);
    this._$stateLayer.style.setProperty('--_rc-button-ripple-y', `${y}px`);
    this._$stateLayer.style.setProperty('--_rc-button-ripple-size', `${radius * 2}px`);
    this._$stateLayer.removeAttribute('data-rippling');
    this._$stateLayer.getBoundingClientRect();
    this._$stateLayer.setAttribute('data-rippling', '');
  }

  protected _handleRippleAnimationEnd(event: AnimationEvent): void {
    if (event.animationName === 'rc-button-ripple') {
      this._$stateLayer.removeAttribute('data-rippling');
    }
  }

  constructor() {
    super();

    this.addEventListener('pointerdown', this._startRipple, { capture: true });
    this.addEventListener('click', this._blockActivation, { capture: true });
    this.addEventListener('click', this._handleToggleActivation);

    this.addEventListener(
      'keydown',
      (event) => {
        if (ACTIVATION_KEYS.has(event.key)) {
          this._blockActivation(event);
        }
      },
      { capture: true },
    );
  }
}

export default RCButton;
