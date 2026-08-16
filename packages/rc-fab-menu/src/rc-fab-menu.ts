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
 * @attr position - Viewport corner where the floating action menu trigger is anchored.
 * @attr placement - Preferred placement of the action menu relative to the trigger button.
 *
 * @cssprop [--rc-fab-menu-position-css=fixed] - CSS position value for the floating wrapper.
 * @cssprop [--rc-fab-menu-inset-block=1.5rem] - Distance from the block-axis edge; falls back
 *   through --rc-fab-inset-block.
 * @cssprop [--rc-fab-menu-inset-inline=1.5rem] - Distance from the inline-axis edge; falls back
 *   through --rc-fab-inset-inline.
 * @cssprop [--rc-fab-menu-z-index=10] - Stacking order for the floating wrapper; falls back
 *   through --rc-fab-z-index.
 * @cssprop [--rc-fab-menu-trigger-gap] - Gap between trigger icon and label content. No default.
 * @cssprop [--rc-fab-menu-size] - Trigger minimum inline and block size. No default; set
 *   explicitly or apply a theme.
 * @cssprop [--rc-fab-menu-padding-block] - Trigger block-axis padding (defers to native button
 *   padding when unset).
 * @cssprop [--rc-fab-menu-padding-inline] - Trigger inline-axis padding (defers to native button
 *   padding when unset).
 * @cssprop [--rc-fab-menu-appearance] - Trigger appearance (defers to native button appearance
 *   when unset).
 * @cssprop [--rc-fab-menu-border] - Trigger border (defers to native button border when unset).
 * @cssprop [--rc-fab-menu-radius] - Trigger border radius (defers to native button radius when
 *   unset).
 * @cssprop [--rc-fab-menu-bg] - Trigger background (defers to native button background when
 *   unset).
 * @cssprop [--rc-fab-menu-color] - Trigger foreground color (defers to native button color when
 *   unset).
 * @cssprop [--rc-fab-menu-shadow] - Trigger elevation shadow (defers to native button shadow
 *   when unset).
 * @cssprop [--rc-fab-menu-font] - Trigger font shorthand (defers to native button font when
 *   unset).
 * @cssprop [--rc-fab-menu-font-family] - Trigger font family (defers to native button font-family
 *   when unset).
 * @cssprop [--rc-fab-menu-font-size] - Trigger font size (defers to native button font-size when
 *   unset).
 * @cssprop [--rc-fab-menu-font-weight] - Trigger font weight (defers to native button font-weight
 *   when unset).
 * @cssprop [--rc-fab-menu-letter-spacing] - Trigger letter spacing (defers to native button
 *   letter-spacing when unset).
 * @cssprop [--rc-fab-menu-text-decoration] - Trigger text decoration (defers to native button
 *   text-decoration when unset).
 * @cssprop [--rc-fab-menu-user-select] - Trigger user-select (defers to native button user-select
 *   when unset).
 * @cssprop [--rc-fab-menu-transition] - Trigger transition shorthand (defers to native button
 *   transition when unset).
 * @cssprop [--rc-fab-menu-bg-hover] - Trigger hover background (defers to native button hover
 *   styling when unset).
 * @cssprop [--rc-fab-menu-shadow-hover] - Trigger hover elevation shadow (defers to native button
 *   hover styling when unset).
 * @cssprop [--rc-fab-menu-bg-open] - Trigger background while the menu is open (defers to native
 *   button styling when unset).
 * @cssprop [--rc-fab-menu-shadow-open] - Trigger elevation shadow while the menu is open (defers
 *   to native button styling when unset).
 * @cssprop [--rc-fab-menu-shadow-active] - Trigger pressed elevation shadow (defers to native
 *   button styling when unset).
 * @cssprop [--rc-fab-menu-active-transform] - Trigger transform while pressed (defers to native
 *   button styling when unset).
 * @cssprop [--rc-fab-menu-focus-ring] - Trigger focus ring (defers to native button focus styling
 *   when unset).
 * @cssprop [--rc-fab-menu-focus-ring-offset] - Trigger focus ring offset (defers to native button
 *   focus styling when unset).
 * @cssprop [--rc-fab-menu-disabled-opacity] - Trigger opacity while disabled (defers to native
 *   disabled styling when unset).
 * @cssprop [--rc-fab-menu-disabled-shadow] - Trigger elevation shadow while disabled (defers to
 *   native disabled styling when unset).
 * @cssprop [--rc-fab-menu-popup-z-index=1000] - Stacking order of the popup container; falls back
 *   through --rc-menu-button-popup-z-index.
 * @cssprop [--rc-fab-menu-popup-duration=0ms] - Popup reveal transition duration.
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
