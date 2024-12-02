import { LitElement, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import type { RCMenu } from '@rcarls/rc-menu';

import menuButtonStyles from './rc-menu-button.styles';

export interface RCMenuButtonToggleEvent {
  open: boolean;
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-menu-button': RCMenuButton;
  }
}

// TODO: Add "menu direction" property to control which side the popup appears on, and coordinate with anchor positioning.
// TODO: use / polyfill anchor positioning and coordinate with "menu direction"

/**
 * A menu button component that opens/closes a menu popup
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/
 * @slot trigger - The button element that triggers the menu
 * @slot default - The rc-menu element to display as popup
 * @fires rc-menu-button-toggle - Fired when the menu opens or closes
 * @csspart root - The root container element
 * @csspart popup - The popup container element
 */
@customElement('rc-menu-button')
export class RCMenuButton extends LitElement {
  static styles = [menuButtonStyles];

  /** Whether the menu is currently open */
  @property({ type: Boolean, reflect: true })
  open = false;

  /**
   * Orientation of this menu button, affects which arrow keys open/close the menu.
   * If not set, inherits from a parent rc-menubar or element with role="menubar".
   */
  @property({ type: String })
  orientation: 'horizontal' | 'vertical' | undefined;

  /**
   * Resolved orientation, considering inheritance from parent menubar.
   * Falls back to 'horizontal' if no orientation is set or inherited.
   */
  private get _resolvedOrientation(): 'horizontal' | 'vertical' {
    if (this.orientation) return this.orientation;

    // Inherit from parent rc-menubar or element with role="menubar"
    const menubar = this.closest('rc-menubar, [role="menubar"]');
    if (menubar) {
      const orientation =
        menubar.getAttribute('orientation') ??
        menubar.getAttribute('aria-orientation');
      if (orientation === 'vertical') return 'vertical';
      if (orientation === 'horizontal') return 'horizontal';
    }

    return 'horizontal';
  }

  /** Reference to the trigger button element */
  @state()
  private _trigger: WeakRef<HTMLElement> | undefined;

  /** Reference to the menu element */
  @state()
  private _menu: WeakRef<RCMenu> | undefined;

  /** Bound handler for document click (light dismiss) */
  private _boundHandleDocumentClick = this._handleDocumentClick.bind(this);

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this._boundHandleDocumentClick, true);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this._boundHandleDocumentClick, true);
  }

  /** Opens the menu and focuses the first item */
  openMenu() {
    if (this.open) return;

    this.open = true;
    this._dispatchToggle();

    // Focus first menu item after render
    this.updateComplete.then(() => {
      const menu = this._menu?.deref();
      menu?.focusFirst();
    });
  }

  /** Closes the menu and optionally returns focus to trigger */
  closeMenu(returnFocus = true) {
    if (!this.open) return;

    this.open = false;
    this._dispatchToggle();

    if (returnFocus) {
      const trigger = this._trigger?.deref();
      trigger?.focus();
    }
  }

  /** Toggles the menu open/closed */
  toggleMenu() {
    if (this.open) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  private _dispatchToggle() {
    this.dispatchEvent(
      new CustomEvent<RCMenuButtonToggleEvent>('rc-menu-button-toggle', {
        bubbles: true,
        composed: true,
        detail: { open: this.open },
      }),
    );
  }

  private _handleTriggerSlotChange(e: Event) {
    const slot = e.currentTarget as HTMLSlotElement;
    const elements = slot.assignedElements();
    const trigger = elements[0] as HTMLElement | undefined;

    if (trigger) {
      this._trigger = new WeakRef(trigger);

      // Set ARIA attributes on trigger
      trigger.setAttribute('aria-haspopup', 'menu');
      trigger.setAttribute('aria-expanded', String(this.open));
    }
  }

  private _handleMenuSlotChange(e: Event) {
    const slot = e.currentTarget as HTMLSlotElement;
    const elements = slot.assignedElements();
    const menu = elements.find((el) => el.tagName === 'RC-MENU') as
      | RCMenu
      | undefined;

    if (menu) {
      this._menu = new WeakRef(menu);
    }
  }

  private _handleTriggerKeyDown(e: KeyboardEvent) {
    const key = e.key;
    const vertical = this._resolvedOrientation === 'vertical';
    const openKey = vertical ? 'ArrowRight' : 'ArrowDown';
    const openLastKey = vertical ? 'ArrowLeft' : 'ArrowUp';

    switch (key) {
      case 'Enter':
      case ' ':
      case openKey:
        e.preventDefault();
        this.openMenu();
        break;
      case openLastKey:
        e.preventDefault();
        this.open = true;
        this._dispatchToggle();
        // Focus last item instead of first
        this.updateComplete.then(() => {
          const menu = this._menu?.deref();
          menu?.focusLast();
        });
        break;
      case 'Escape':
        if (this.open) {
          e.preventDefault();
          this.closeMenu();
        }
        break;
    }
  }

  private _handleTriggerClick(e: MouseEvent) {
    e.preventDefault();
    this.toggleMenu();
  }

  private _handleMenuClose() {
    this.closeMenu();
  }

  private _handleMenuActivate() {
    // Close menu after item activation
    this.closeMenu();
  }

  private _handleDocumentClick(e: MouseEvent) {
    if (!this.open) return;

    const path = e.composedPath();

    // Check if click was inside this component
    if (path.includes(this)) return;

    // Close menu on outside click
    this.closeMenu(false);
  }

  protected updated(changedProperties: Map<PropertyKey, unknown>) {
    super.updated(changedProperties);

    // Keep aria-expanded in sync
    if (changedProperties.has('open')) {
      const trigger = this._trigger?.deref();
      trigger?.setAttribute('aria-expanded', String(this.open));
    }
  }

  protected render() {
    return html`
      <div id="root" part="root">
        <div
          id="trigger-wrap"
          @keydown=${this._handleTriggerKeyDown}
          @click=${this._handleTriggerClick}
        >
          <slot
            name="trigger"
            @slotchange=${this._handleTriggerSlotChange}
          ></slot>
        </div>
        <div
          id="popup"
          part="popup"
          ?hidden=${!this.open}
          @rc-menu-close=${this._handleMenuClose}
          @rc-menu-activate=${this._handleMenuActivate}
        >
          <slot @slotchange=${this._handleMenuSlotChange}></slot>
        </div>
      </div>
    `;
  }
}

export default RCMenuButton;
