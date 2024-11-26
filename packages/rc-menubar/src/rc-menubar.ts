import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import {
  keyNavigation,
  type KeyboardNavigationAction,
} from '@rcarls/rc-common';

import type {
  RCMenuButton,
  RCMenuButtonToggleEvent,
} from '@rcarls/rc-menu-button';

import menubarStyles from './rc-menubar.styles';

declare global {
  interface HTMLElementTagNameMap {
    'rc-menubar': RCMenubar;
  }
}

// TODO: consider using aria-activedescendent instead, read expected tab behavior in a menubar

/**
 * A menubar component containing menu buttons, as defined in WAI-ARIA
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
 * @slot default - Takes rc-menu-button elements to display in the menubar
 * @csspart root - The root container element
 * @cssprop --rc-menubar-gap - Gap between menu buttons
 * @cssprop --rc-menubar-padding-inline - Horizontal padding
 * @cssprop --rc-menubar-padding-block - Vertical padding
 */
@customElement('rc-menubar')
export class RCMenubar extends LitElement {
  static styles = [menubarStyles];

  /** Accessible label for this menubar */
  @property({ type: String })
  label = 'Menu';

  /** Menubar orientation, for keyboard navigation */
  @property({ type: String })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  /** Reference to the currently open menu button */
  @state()
  private _activeMenuButton: WeakRef<RCMenuButton> | undefined;

  /** The last menu button trigger to have focus */
  @state()
  private _lastFocused: HTMLElement | undefined;

  /** Array of menu button elements */
  private _menuButtons: WeakRef<RCMenuButton>[] = [];

  /** Get the trigger element from a menu button */
  private _getTrigger(menuButton: RCMenuButton): HTMLElement | null {
    return menuButton.querySelector('[slot="trigger"]');
  }

  /** Array of focusable trigger elements */
  get items(): HTMLElement[] {
    return this._menuButtons
      .map((ref) => ref.deref())
      .filter((el): el is RCMenuButton => el != null)
      .map((mb) => this._getTrigger(mb))
      .filter((el): el is HTMLElement => el != null);
  }

  /** Array of menu button elements */
  get menuButtons(): RCMenuButton[] {
    return this._menuButtons
      .map((ref) => ref.deref())
      .filter((el): el is RCMenuButton => el != null);
  }

  /** First trigger element */
  get firstItem(): HTMLElement | undefined {
    return this.items.at(0);
  }

  /** Last trigger element */
  get lastItem(): HTMLElement | undefined {
    return this.items.at(-1);
  }

  /** Next trigger element, in tab-order */
  get nextItem(): HTMLElement | undefined {
    const index = this._lastFocused ? this.items.indexOf(this._lastFocused) : 0;
    return this.items.at((index + 1) % this.items.length);
  }

  /** Previous trigger element, in tab-order */
  get previousItem(): HTMLElement | undefined {
    const index = this._lastFocused ? this.items.indexOf(this._lastFocused) : 0;
    return this.items.at((index - 1) % this.items.length);
  }

  /** Get the menu button that contains a trigger */
  private _getMenuButtonForTrigger(
    trigger: HTMLElement,
  ): RCMenuButton | undefined {
    return this.menuButtons.find((mb) => this._getTrigger(mb) === trigger);
  }

  /** Set focus to a specific trigger element */
  focusItem(item?: HTMLElement | null) {
    if (item != null) {
      item.focus();
    }
  }

  /** Close any open menu */
  closeActiveMenu() {
    const activeMenuButton = this._activeMenuButton?.deref();
    if (activeMenuButton) {
      activeMenuButton.closeMenu(false);
      this._activeMenuButton = undefined;
    }
  }

  private _handleItemFocus(e: FocusEvent) {
    const target = e.target as HTMLElement;

    // Check if focus is on a trigger (slot="trigger")
    if (target.slot !== 'trigger') return;

    this._lastFocused = target;

    // Set roving tab index
    this.items.forEach((el) => el.setAttribute('tabindex', '-1'));
    target.setAttribute('tabindex', '0');
  }

  private _handleSlotChange(e: Event) {
    const slot = e.currentTarget as HTMLSlotElement;
    const elements = slot.assignedElements();

    // Reset tabindex on old items
    this._menuButtons.forEach((ref) => {
      const mb = ref.deref();
      if (mb) {
        const trigger = this._getTrigger(mb);
        trigger?.removeAttribute('tabindex');
      }
    });

    // Get menu buttons from slotted elements
    this._menuButtons = elements
      .filter((el): el is RCMenuButton => el.tagName === 'RC-MENU-BUTTON')
      .map((el) => new WeakRef(el));

    // Initialize tabindex for triggers
    const items = this.items;
    items.forEach((trigger, index) => {
      if (index === 0) {
        trigger.setAttribute('tabindex', '0');
      } else {
        trigger.setAttribute('tabindex', '-1');
      }
    });

    // Set initial focus reference
    if (items.length > 0 && !this._lastFocused) {
      this._lastFocused = items[0];
    }
  }

  private _handleMenuButtonToggle(e: CustomEvent<RCMenuButtonToggleEvent>) {
    const menuButton = e.target as RCMenuButton;

    if (e.detail.open) {
      // Track the newly opened menu
      this._activeMenuButton = new WeakRef(menuButton);
    } else {
      // Clear active menu if this was the active one
      if (this._activeMenuButton?.deref() === menuButton) {
        this._activeMenuButton = undefined;
      }
    }
  }

  private _handleNavigate(action: KeyboardNavigationAction) {
    const activeMenu = this._activeMenuButton?.deref();
    const wasMenuOpen = activeMenu?.open ?? false;

    switch (action) {
      case 'next': {
        // Close current menu and move to next
        if (wasMenuOpen) {
          this.closeActiveMenu();
        }
        this.focusItem(this.nextItem);
        // If a menu was open, open the new one
        if (wasMenuOpen) {
          this._openCurrentMenu();
        }
        break;
      }
      case 'prev': {
        // Close current menu and move to previous
        if (wasMenuOpen) {
          this.closeActiveMenu();
        }
        this.focusItem(this.previousItem);
        // If a menu was open, open the new one
        if (wasMenuOpen) {
          this._openCurrentMenu();
        }
        break;
      }
      case 'start':
        if (wasMenuOpen) {
          this.closeActiveMenu();
        }
        this.focusItem(this.firstItem);
        if (wasMenuOpen) {
          this._openCurrentMenu();
        }
        break;
      case 'end':
        if (wasMenuOpen) {
          this.closeActiveMenu();
        }
        this.focusItem(this.lastItem);
        if (wasMenuOpen) {
          this._openCurrentMenu();
        }
        break;
      case 'escape':
        this.closeActiveMenu();
        break;
    }
  }

  private _openCurrentMenu() {
    if (this._lastFocused) {
      const menuButton = this._getMenuButtonForTrigger(this._lastFocused);
      if (menuButton) {
        menuButton.openMenu();
      }
    }
  }

  private _handleKeyDown(e: KeyboardEvent) {
    // Handle Down arrow to open menu (not handled by keyNavigation for horizontal orientation)
    if (e.key === 'ArrowDown' && this.orientation === 'horizontal') {
      if (this._lastFocused) {
        const menuButton = this._getMenuButtonForTrigger(this._lastFocused);
        if (menuButton && !menuButton.open) {
          e.preventDefault();
          menuButton.openMenu();
        }
      }
    }
  }

  protected render() {
    return html`
      <div
        id="root"
        part="root"
        ${keyNavigation(this._onNavigate, { handleEscape: true })}
        @keydown=${this._handleKeyDown}
        data-interaction-mode="keyboard"
        role="menubar"
        aria-orientation=${this.orientation}
        aria-label=${this.label}
      >
        <div
          id="slot-wrap"
          @focusin=${this._handleItemFocus}
          @rc-menu-button-toggle=${this._handleMenuButtonToggle}
        >
          <slot @slotchange=${this._handleSlotChange}></slot>
        </div>
      </div>
    `;
  }

  private _onNavigate = (action: KeyboardNavigationAction) => {
    this._handleNavigate(action);
  };
}

export default RCMenubar;
