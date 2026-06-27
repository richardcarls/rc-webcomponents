import { LitElement, html } from 'lit';
import { property, state } from 'lit/decorators.js';

import { type KeyboardNavigationAction } from '@rcarls/rc-common';

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

// Roving tabindex (not aria-activedescendant): trigger buttons need real focus
// for submenu handoff and screen reader announcements.

/**
 * A menubar component containing menu buttons, as defined in WAI-ARIA
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/menubar/
 * @slot default - Takes rc-menu-button elements to display in the menubar
 * @csspart root - The root container element
 * @cssprop [--rc-menubar-gap=var(--rc-control-gap)] - Gap between menu buttons
 * @cssprop [--rc-menubar-padding-inline=var(--rc-control-padding-inline)] - Inline-axis padding
 * @cssprop [--rc-menubar-padding-block=var(--rc-control-padding-block)] - Block-axis padding
 * @cssprop [--rc-menubar-border=var(--rc-border)] - Root container border
 * @cssprop [--rc-menubar-radius=var(--rc-control-radius)] - Root container border radius
 * @cssprop [--rc-menubar-background=Canvas] - Root container background
 * @cssprop [--rc-menubar-color=CanvasText] - Root container text color
 * @cssprop [--rc-menubar-item-block-size=2.25em] - Minimum block size for child menu-button triggers
 * @cssprop [--rc-menubar-item-padding-block=0.25em] - Child trigger block-axis padding
 * @cssprop [--rc-menubar-item-padding-inline=0.75em] - Child trigger inline-axis padding
 * @cssprop [--rc-menubar-item-gap=var(--rc-item-gap)] - Gap between flex children inside child triggers
 * @cssprop [--rc-menubar-item-border=1px solid transparent] - Child trigger border
 * @cssprop [--rc-menubar-item-radius=var(--rc-control-radius)] - Child trigger border radius
 * @cssprop [--rc-menubar-item-background=transparent] - Child trigger background
 * @cssprop [--rc-menubar-item-color=inherit] - Child trigger text color
 * @cssprop [--rc-menubar-item-transition] - CSS transition applied to child triggers
 * @cssprop [--rc-menubar-item-hover-background=color-mix(in srgb, Highlight 8%, transparent)] - Child trigger hover background
 * @cssprop [--rc-menubar-item-hover-color=inherit] - Child trigger hover text color
 * @cssprop [--rc-menubar-item-hover-border-color=transparent] - Child trigger hover border color
 * @cssprop [--rc-menubar-item-open-background=color-mix(in srgb, Highlight 12%, transparent)] - Child trigger background when its menu is open
 * @cssprop [--rc-menubar-item-open-color=inherit] - Child trigger text color when its menu is open
 * @cssprop [--rc-menubar-item-open-border-color=transparent] - Child trigger border color when its menu is open
 */
export class RCMenubar extends LitElement {
  static styles = [menubarStyles];

  /** Accessible label for this menubar */
  @property({ type: String })
  label = 'Menu';

  /** Menubar orientation, for keyboard navigation */
  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  /** Reference to the currently open menu button */
  @state()
  private _activeMenuButton: WeakRef<RCMenuButton> | undefined;

  /** The last menu button trigger to have focus */
  @state()
  private _lastFocused: HTMLElement | undefined;

  /** Array of menu button elements */
  private _menuButtons: WeakRef<RCMenuButton>[] = [];

  private _boundHandleKeydown = this._handleKeydown.bind(this);

  private _boundHandleClick = this._handleClick.bind(this);

  override connectedCallback() {
    super.connectedCallback();

    this._syncHostAria();
    this.addEventListener('keydown', this._boundHandleKeydown);
    this.addEventListener('click', this._boundHandleClick);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();

    this.removeEventListener('keydown', this._boundHandleKeydown);
    this.removeEventListener('click', this._boundHandleClick);
  }

  protected override updated(changedProperties: Map<PropertyKey, unknown>) {
    super.updated(changedProperties);

    if (
      changedProperties.has('label') ||
      changedProperties.has('orientation')
    ) {
      this._syncHostAria();
      this._syncMenuButtonOrientation();
    }
  }

  /** Keep ARIA semantics on the custom element host for slotted children. */
  private _syncHostAria(): void {
    this.setAttribute('role', 'menubar');
    this.setAttribute('aria-label', this.label);
    this.setAttribute('aria-orientation', this.orientation);
  }

  private _syncMenuButtonOrientation(): void {
    this.menuButtons.forEach((menuButton) => {
      menuButton.orientation = this.orientation;
    });
  }

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

    const prevButtons = this._menuButtons;

    // Cache element references synchronously — defer all DOM mutations.
    // slotchange fires synchronously inside a framework reactive update pass
    // on second+ mount (shadow DOM already exists), so the handler must be
    // instantaneous to avoid interacting with the reactive system.
    this._menuButtons = elements
      .filter((el): el is RCMenuButton => el.tagName === 'RC-MENU-BUTTON')
      .map((el) => new WeakRef(el));

    queueMicrotask(() => {
      if (!this.isConnected) return;

      prevButtons.forEach((ref) => {
        const menuButton = ref.deref();
        if (!menuButton) return;

        menuButton.removeAttribute('role');

        const trigger = this._getTrigger(menuButton);
        trigger?.removeAttribute('tabindex');
        trigger?.removeAttribute('role');
      });

      this.menuButtons.forEach((menuButton) => {
        menuButton.removeAttribute('role');
        menuButton.orientation = this.orientation;

        const trigger = this._getTrigger(menuButton);
        trigger?.setAttribute('role', 'menuitem');
      });

      const items = this.items;

      items.forEach((trigger, index) => {
        trigger.setAttribute('tabindex', index === 0 ? '0' : '-1');
      });

      if (items.length > 0 && !this._lastFocused) {
        this._lastFocused = items[0];
      }
    });
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

  private _handleKeydown(e: KeyboardEvent): void {
    const key = this._normalizeKey(e.key);
    const navNext = this.orientation === 'horizontal' ? 'ArrowRight' : 'ArrowDown';
    const navPrev = this.orientation === 'horizontal' ? 'ArrowLeft' : 'ArrowUp';

    let action: KeyboardNavigationAction | undefined;

    if (key === navNext) {
      action = 'next';
    } else if (key === navPrev) {
      action = 'prev';
    } else if (key === 'Home') {
      action = 'start';
    } else if (key === 'End') {
      action = 'end';
    } else if (key === 'Escape') {
      action = 'escape';
    } else if (key === 'Tab') {
      this.setAttribute('data-interaction-mode', 'keyboard');
    }

    if (!action) return;

    this._handleNavigate(action);
    this.setAttribute('data-interaction-mode', 'keyboard');
    e.stopPropagation();
    e.preventDefault();
  }

  private _handleClick(): void {
    this.removeAttribute('data-interaction-mode');
  }

  private _normalizeKey(key: string): string {
    switch (key) {
      case 'Up':
        return 'ArrowUp';
      case 'Down':
        return 'ArrowDown';
      case 'Left':
        return 'ArrowLeft';
      case 'Right':
        return 'ArrowRight';
      default:
        return key;
    }
  }

  protected render() {
    return html`
      <div
        id="root"
        part="root"
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
}

export default RCMenubar;
