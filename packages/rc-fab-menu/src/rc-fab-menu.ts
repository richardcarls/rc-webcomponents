import { property } from 'lit/decorators.js';

import type { AnchorPlacement } from '@rcarls/rc-common';
import { RCMenuButton, type RCMenuButtonToggleEvent } from '@rcarls/rc-menu-button';

import fabMenuStyles from './rc-fab-menu.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-fab-menu': RCFabMenu;
  }

  interface HTMLElementEventMap {
    'rc-fab-menu-toggle': CustomEvent<RCFabMenuToggleEvent>;
  }
}

/** Detail payload for the `rc-fab-menu-toggle` event. */
export type RCFabMenuToggleEvent = RCMenuButtonToggleEvent;

export type RCFabMenuPosition = 'bottom-end' | 'bottom-start' | 'top-end' | 'top-start';

/**
 * Floating action button menu wrapper for an `rc-menu` action surface.
 *
 * `rc-fab-menu` specializes `rc-menu-button` for floating action menus. It
 * preserves the menu-button keyboard, focus return, light-dismiss, and popup
 * positioning behavior while applying FAB placement and reveal styling.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-fab-menu rc-fab-menu docs}
 * @see {@link https://m3.material.io/components/floating-action-button/overview Material 3 floating action button}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/ WAI-ARIA Menu Button pattern}
 *
 * @example
 * ```html
 * <rc-fab-menu>
 *   <button slot="trigger" type="button" aria-label="Create">
 *     <span aria-hidden="true">+</span>
 *   </button>
 *   <rc-menu label="Create">
 *     <button>Recipe</button>
 *     <button>Collection</button>
 *   </rc-menu>
 * </rc-fab-menu>
 * ```
 *
 * @slot trigger - Native button or button-like element that opens the action menu.
 * @slot default - `rc-menu` element containing floating action commands.
 *
 * @fires rc-fab-menu-toggle - Fired when user interaction opens or closes the action menu.
 *
 * @cssprop [--rc-fab-menu-position-css=fixed] - CSS position value for the floating wrapper.
 * @cssprop [--rc-fab-menu-inset-block=var(--rc-fab-inset-block)] - Distance from the block-axis edge.
 * @cssprop [--rc-fab-menu-inset-inline=var(--rc-fab-inset-inline)] - Distance from the inline-axis edge.
 * @cssprop [--rc-fab-menu-z-index=var(--rc-fab-z-index)] - Stacking order for the floating wrapper.
 * @cssprop [--rc-fab-menu-size=var(--rc-fab-size)] - Trigger minimum inline and block size.
 * @cssprop [--rc-fab-menu-padding-inline=var(--rc-fab-padding-inline)] - Trigger inline padding.
 * @cssprop [--rc-fab-menu-radius=var(--rc-fab-radius)] - Trigger border radius.
 * @cssprop [--rc-fab-menu-bg=var(--rc-fab-bg)] - Trigger background color.
 * @cssprop [--rc-fab-menu-bg-hover=var(--rc-fab-bg-hover)] - Trigger hover background color.
 * @cssprop [--rc-fab-menu-bg-open=var(--rc-fab-menu-bg-hover)] - Trigger open background color.
 * @cssprop [--rc-fab-menu-color=var(--rc-fab-color)] - Trigger foreground color.
 * @cssprop [--rc-fab-menu-shadow=var(--rc-fab-shadow)] - Trigger elevation shadow.
 * @cssprop [--rc-fab-menu-shadow-hover=var(--rc-fab-shadow-hover)] - Trigger hover elevation shadow.
 * @cssprop [--rc-fab-menu-shadow-active=var(--rc-fab-shadow-active)] - Trigger pressed elevation shadow.
 * @cssprop [--rc-fab-menu-focus-ring=var(--rc-fab-focus-ring)] - Trigger focus ring.
 * @cssprop [--rc-fab-menu-popup-duration=160ms] - Popup reveal transition duration.
 * @cssprop [--rc-fab-menu-popup-transform-origin=bottom right] - Popup reveal transform origin.
 *
 * @csspart root - The root popup anchor inherited from `rc-menu-button`.
 * @csspart popup - The popup container inherited from `rc-menu-button`.
 */
export class RCFabMenu extends RCMenuButton {
  static override styles = [fabMenuStyles];

  /** Viewport corner where the floating action menu trigger is anchored. */
  @property({ type: String, reflect: true })
  position: RCFabMenuPosition = 'bottom-end';

  /** Preferred placement of the action menu relative to the trigger button. */
  @property({ reflect: true })
  override placement: AnchorPlacement = 'top-end';

  /** Dispatches the `rc-fab-menu-toggle` bubbling composed event with the current open state. */
  protected override _dispatchToggle(): void {
    this.dispatchEvent(
      new CustomEvent<RCFabMenuToggleEvent>('rc-fab-menu-toggle', {
        bubbles: true,
        composed: true,
        detail: { open: this.open },
      }),
    );
  }
}

export default RCFabMenu;
