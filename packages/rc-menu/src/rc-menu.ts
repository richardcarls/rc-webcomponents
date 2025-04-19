import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import {
  keyNavigation,
  type KeyboardNavigationAction,
  RovingTabIndexMixin,
} from '@rcarls/rc-common';

import menuStyles from './rc-menu.styles';

export interface RCMenuActivateEvent {
  item: HTMLElement;
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-menu': RCMenu;
  }
}

/**
 * A menu component, as defined in WAI-ARIA
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 * @slot Takes any number of child elements to display in the menu. Only focusable elements are navigable.
 * @fires rc-menu-activate - Fired when a menu item is activated via Enter or Space
 * @fires rc-menu-close - Fired when Escape is pressed
 * @csspart root - The root container element
 */
@customElement('rc-menu')
export class RCMenu extends RovingTabIndexMixin(LitElement) {
  static styles = [menuStyles];

  /** Accessible label for this menu. */
  @property({ type: String })
  label = '';

  @query('#root', true)
  protected _$root!: HTMLDivElement;

  protected override _initItems() {
    super._initItems(); // sets tabindex 0/−1
    this.items.forEach((el) => el.setAttribute('role', 'menuitem'));
  }

  protected _onNavigate(action: KeyboardNavigationAction) {
    switch (action) {
      case 'next':
        this.focusItem(this.nextItem);
        break;
      case 'prev':
        this.focusItem(this.previousItem);
        break;
      case 'start':
        this.focusItem(this.firstItem);
        break;
      case 'end':
        this.focusItem(this.lastItem);
        break;
      case 'activate':
        if (this._lastFocused) {
          this._lastFocused.click();
          this.dispatchEvent(
            new CustomEvent<RCMenuActivateEvent>('rc-menu-activate', {
              bubbles: true,
              composed: true,
              detail: { item: this._lastFocused },
            }),
          );
        }
        break;
      case 'escape':
        this.dispatchEvent(
          new CustomEvent('rc-menu-close', {
            bubbles: true,
            composed: true,
          }),
        );
        break;
    }
  }

  protected render() {
    return html`
      <div
        id="root"
        part="root"
        ${keyNavigation(this._onNavigate, {
          handleEscape: true,
          handleActivate: true,
        })}
        data-interaction-mode="keyboard"
        role="menu"
        aria-label=${this.label}
        tabindex="-1"
      >
        <div id="slot-wrap" @focusin=${this._handleItemFocus}>
          <slot id="items" @slotchange=${this._onSlotChange}></slot>
        </div>
      </div>
    `;
  }
}

export default RCMenu;
