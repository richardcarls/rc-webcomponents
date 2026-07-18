import { LitElement, html } from 'lit';
import type { PropertyValues } from 'lit';
import { property, query } from 'lit/decorators.js';

import buttonStyles from './rc-button.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-button': RCButton;
  }
}

const LIGHT_DOM_CSS = `
@layer rc-base {
  rc-button[selected] > button > [data-rc-button-icon] {
    display: none;
  }

  rc-button:not([selected]) > button > [data-rc-button-selected-icon] {
    display: none;
  }
}
`;

const ACTIVATION_KEYS = new Set(['Enter', ' ']);

/**
 * Structural button wrapper that preserves a direct native `<button>` child for
 * progressive enhancement, forms, labels, and keyboard behavior.
 *
 * @slot - A direct native `<button>` child.
 *
 * @csspart state-layer - Overlay layer for hover, focus, pressed, ripple, or design-system effects.
 * @csspart progress - Non-interactive progress affordance overlay shown for `pending` or `progress`.
 *
 * @attr disabled - Mirrors disabled state to the native child button.
 * @attr pending - Blocks activation and exposes progress affordance while work is pending.
 * @attr progress - Blocks activation and exposes progress affordance.
 * @attr selected - Declarative selected state for theme styling and icon switching.
 * @attr icon-only - Removes label-oriented inline padding in supporting themes.
 * @attr full-width - Stretches the native child button to the host inline size.
 */
export class RCButton extends LitElement {
  static override styles = buttonStyles;

  private static readonly _styledRoots = new Set<Document | ShadowRoot>();

  private static _ensureBaseStyles(root: Document | ShadowRoot): void {
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

  /** Show progress affordance and block activation while preserving native focus behavior. */
  @property({ type: Boolean, reflect: true })
  pending = false;

  /** Structural progress state; boolean/indeterminate in v1. */
  @property({ type: Boolean, reflect: true })
  progress = false;

  /** Declarative selected state for theme styling and icon switching. */
  @property({ type: Boolean, reflect: true })
  selected = false;

  /** Icon-only layout hint. May also be reflected by child classification. */
  @property({ type: Boolean, attribute: 'icon-only', reflect: true })
  iconOnly = false;

  /** Stretch the native child button to the host inline size. */
  @property({ type: Boolean, attribute: 'full-width', reflect: true })
  fullWidth = false;

  @query('slot') private _$slot!: HTMLSlotElement;

  private _button: HTMLButtonElement | null = null;
  private _buttonObserver: MutationObserver | null = null;
  private _disabledOwned = false;
  private _ariaBusyOwned = false;
  private _iconOnlyOwned = false;
  private _slotMicrotaskQueued = false;

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
  }

  protected override render() {
    return html`
      <slot @slotchange=${this._handleSlotChange}></slot>
      <span part="state-layer" aria-hidden="true"></span>
      <span part="progress" aria-hidden="true"></span>
    `;
  }

  private _handleSlotChange(): void {
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

  private _syncSlottedButton(): void {
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

    if (nextButton === this._button) {
      this._classifyButton();
      this._syncNativeState();

      return;
    }

    this._buttonObserver?.disconnect();
    this._buttonObserver = null;
    this._button = nextButton;
    this._disabledOwned = false;
    this._ariaBusyOwned = false;

    if (nextButton) {
      this._buttonObserver = new MutationObserver(() => {
        this._classifyButton();
        this._syncNativeState();
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
  }

  private _classifyButton(): void {
    const button = this._button;
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

  private _hasLabel(button: HTMLButtonElement | null): boolean {
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

  private _syncNativeState(): void {
    const button = this._button;

    if (!button) {
      return;
    }

    if (this.disabled) {
      if (!button.disabled) {
        this._disabledOwned = true;
      }

      button.disabled = true;
    } else if (this._disabledOwned) {
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

  private _shouldBlockActivation(): boolean {
    return this.pending || this.progress;
  }

  private _isChildButtonEvent(event: Event): boolean {
    return !!this._button && event.composedPath().includes(this._button);
  }

  private _blockActivation(event: Event): void {
    if (!this._shouldBlockActivation() || !this._isChildButtonEvent(event)) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();
  }

  constructor() {
    super();

    this.addEventListener('click', this._blockActivation, { capture: true });

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
