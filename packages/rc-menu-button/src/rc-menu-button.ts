import { LitElement, html } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import {
  AnchorController,
  keyNavigation,
  type KeyboardNavigationAction,
} from '@rcarls/rc-common';
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
 * @cssprop [--rc-menu-button-popup-z-index=1000] - Z-index of the popup overlay
 * @csspart root - The root container element
 * @csspart popup - The popup container element
 */
export class RCMenuButton extends LitElement {
  static styles = [menuButtonStyles];

  /**
   * Enables delegatesFocus so the browser routes focus() on the host element
   * to the slotted trigger button. This lets the host participate in a
   * roving-tabindex group (e.g. rc-toolbar) as a single tab stop while the
   * trigger remains the visible focus target.
   */
  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  private _defaultOpen = false;
  private _open = false;

  /** Whether the menu is currently open. Host writes update silently. */
  @property({ type: Boolean, reflect: true })
  get open(): boolean {
    return this._open;
  }

  /** Whether the menu is currently open. Host writes update silently. */
  set open(value: boolean | undefined) {
    const oldValue = this._open;

    if (value === undefined) return;

    this._setOpen(value, false);
    this.requestUpdate('open', oldValue);
  }

  /** Initial uncontrolled open state. */
  @property({ type: Boolean, attribute: 'default-open' })
  get defaultOpen(): boolean {
    return this._defaultOpen;
  }

  /** Initial uncontrolled open state. */
  set defaultOpen(value: boolean) {
    const oldValue = this._defaultOpen;

    this._defaultOpen = value;

    if (value && !this._open) {
      this._setOpen(true, false);
    }

    this.requestUpdate('defaultOpen', oldValue);
  }

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

  @query('#root') private _$root!: HTMLElement;
  @query('#popup') private _$popup!: HTMLElement;

  /** Reference to the trigger button element */
  @state()
  private _trigger: WeakRef<HTMLElement> | undefined;

  /** Reference to the menu element */
  @state()
  private _menu: WeakRef<RCMenu> | undefined;

  private _anchorCtrl = new AnchorController(this, {
    anchor: () => this._$root ?? null,
    floating: () => this._$popup ?? null,
    shadowHost: () => this,
    placement: 'bottom-start',
    offset: 2,
  });

  /** Bound handler for document click (light dismiss) */
  private _boundHandleDocumentClick = this._handleDocumentClick.bind(this);

  /**
   * Watches the host's own `tabindex` attribute so the trigger button's
   * tabindex can be kept in sync. When a parent (e.g. rc-toolbar) places the
   * host under roving-tabindex management it sets/removes tabindex on the
   * host; we mirror that to the trigger so it doesn't become an independent
   * tab stop. When the host has no tabindex the trigger keeps its natural
   * tabindex=0 for standalone usage.
   */
  private _tabObserver?: MutationObserver;

  connectedCallback() {
    super.connectedCallback();

    this._tabObserver = new MutationObserver(() => this._syncTriggerTabindex());
    this._tabObserver.observe(this, { attributes: true, attributeFilter: ['tabindex'] });

    document.addEventListener('click', this._boundHandleDocumentClick, true);

    if (this.defaultOpen) {
      this._setOpen(true, false);
    }
  }

  disconnectedCallback() {
    this._tabObserver?.disconnect();
    this._tabObserver = undefined;

    super.disconnectedCallback();
    document.removeEventListener('click', this._boundHandleDocumentClick, true);
  }

  /** Opens the menu and focuses the first or last item */
  openMenu(focusTarget: 'first' | 'last' = 'first') {
    if (this.open) return;

    this._setOpen(true, true);
    this._anchorCtrl.update();

    this.updateComplete.then(() => {
      const menu = this._menu?.deref();
      focusTarget === 'last' ? menu?.focusLast() : menu?.focusFirst();
    });
  }

  /** Closes the menu and optionally returns focus to trigger */
  closeMenu(returnFocus = true) {
    if (!this.open) return;

    this._setOpen(false, true);

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
    const trigger = slot.assignedElements()[0] as HTMLElement | undefined;

    if (trigger) {
      this._trigger = new WeakRef(trigger);
      this._syncTriggerAria();
      this._syncTriggerTabindex();
    }
  }

  /**
   * Mirrors the host's `tabindex` attribute to the trigger button.
   *
   * When a roving-tabindex parent (e.g. rc-toolbar) marks this host inactive
   * with `tabindex="-1"`, the trigger must also be suppressed so it does not
   * become an independent tab stop. When the host is the active item
   * (`tabindex="0"`) or standalone (no tabindex), the trigger retains its
   * natural focusability so that Chrome's delegatesFocus can route sequential
   * Tab navigation through the host to the trigger.
   */
  private _syncTriggerTabindex() {
    const trigger = this._trigger?.deref();

    if (!trigger) return;

    if (this.getAttribute('tabindex') === '-1') {
      trigger.setAttribute('tabindex', '-1');
    } else {
      trigger.removeAttribute('tabindex');
    }
  }

  /**
   * Overrides the default focus() so that programmatic focus calls (e.g. from
   * a roving-tabindex parent navigating back to this element via arrow keys)
   * always reach the trigger.
   *
   * Chrome's delegatesFocus will not delegate to a tabindex="-1" element, so
   * when the toolbar marks this host inactive it suppresses the trigger — and
   * the next focusItem() call silently fails. Lifting the suppression here and
   * directly calling trigger.focus() bypasses that restriction.
   */
  override focus(options?: FocusOptions) {
    const trigger = this._trigger?.deref();

    if (!trigger) {
      super.focus(options);
      return;
    }

    trigger.removeAttribute('tabindex');
    trigger.focus(options);
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

  private _onNavigate = (action: KeyboardNavigationAction) => {
    switch (action) {
      case 'open-to-first':
      case 'activate':
        this.openMenu();
        break;
      case 'open-to-last':
        this.openMenu('last');
        break;
      case 'escape':
        this.closeMenu();
        break;
    }
  };

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
      this._syncTriggerAria();
    }
  }

  private _setOpen(open: boolean, dispatch: boolean): void {
    if (this._open === open) return;

    const oldValue = this._open;

    this._open = open;
    this.requestUpdate('open', oldValue);
    this._syncTriggerAria();

    if (dispatch) this._dispatchToggle();
  }

  private _syncTriggerAria(): void {
    const trigger = this._trigger?.deref();
    if (!trigger?.isConnected) return;

    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.setAttribute('aria-expanded', String(this.open));
  }

  protected render() {
    return html`
      <div id="root" part="root">
        <div
          id="trigger-wrap"
          ${keyNavigation(this._onNavigate, {
            navigationAxis: this._resolvedOrientation,
            handleNavAxis: false,
            handleOpenAxis: true,
            handleActivate: true,
            handleEscape: this.open,
          })}
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
