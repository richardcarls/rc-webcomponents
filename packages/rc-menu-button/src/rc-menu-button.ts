import { LitElement, html } from 'lit';
import { property, query, state } from 'lit/decorators.js';

import {
  AnchorController,
  keyInteraction,
  keyNavigation,
  type AnchorPlacement,
  type KeyboardNavigationAction,
} from '@rcarls/rc-common';
import type { RCMenu } from '@rcarls/rc-menu';

import menuButtonStyles from './rc-menu-button.styles';

declare global {
  interface HTMLElementTagNameMap {
    'rc-menu-button': RCMenuButton;
  }
}

/** Detail payload for the `rc-menu-button-toggle` event. */
export interface RCMenuButtonToggleEvent {
  /** Whether the menu transitioned to open (`true`) or closed (`false`). */
  open: boolean;
}

/**
 * Trigger button that opens an rc-menu popup, following the WAI-ARIA Menu Button pattern.
 *
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-menu-button rc-menu-button docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/ WAI-ARIA Menu Button pattern}
 *
 * @slot trigger - The button element that triggers the menu
 * @slot default - The rc-menu element to display as popup
 *
 * @fires rc-menu-button-toggle - Fired when the menu opens or closes
 *
 * @cssprop [--rc-menu-button-trigger-block-size=var(--rc-control-block-size)] - Minimum block size of the trigger
 * @cssprop [--rc-menu-button-trigger-padding-block=var(--rc-control-padding-block)] - Trigger block-axis padding
 * @cssprop [--rc-menu-button-trigger-padding-inline=var(--rc-control-padding-inline)] - Trigger inline-axis padding
 * @cssprop [--rc-menu-button-trigger-gap=var(--rc-item-gap)] - Gap between flex children in the trigger
 * @cssprop [--rc-menu-button-trigger-border=var(--rc-border)] - Trigger border
 * @cssprop [--rc-menu-button-trigger-radius=var(--rc-control-radius)] - Trigger border radius
 * @cssprop [--rc-menu-button-trigger-background=var(--rc-button-bg)] - Trigger background
 * @cssprop [--rc-menu-button-trigger-color=var(--rc-button-text)] - Trigger text color
 * @cssprop [--rc-menu-button-trigger-transition] - CSS transition applied to the trigger
 * @cssprop [--rc-menu-button-trigger-hover-background=color-mix(in srgb, Highlight 8%, transparent)] - Trigger hover background
 * @cssprop [--rc-menu-button-trigger-hover-color=inherit] - Trigger hover text color
 * @cssprop [--rc-menu-button-trigger-hover-border-color=currentColor] - Trigger hover border color
 * @cssprop [--rc-menu-button-trigger-open-background=color-mix(in srgb, Highlight 12%, transparent)] - Trigger background when the menu is open
 * @cssprop [--rc-menu-button-trigger-open-color=inherit] - Trigger text color when the menu is open
 * @cssprop [--rc-menu-button-trigger-open-border-color=currentColor] - Trigger border color when the menu is open
 * @cssprop [--rc-menu-button-popup-z-index=1000] - Z-index of the popup overlay
 *
 * @csspart root - The root container element
 * @csspart popup - The popup container element
 *
 * @attr placement - Preferred placement of the popup relative to the trigger.
 */
export class RCMenuButton extends LitElement {
  static styles = [menuButtonStyles];

  /**
   * Enables delegatesFocus so the browser routes focus() on the host element
   * to the slotted trigger button.
   */
  static override shadowRootOptions: ShadowRootInit = {
    ...LitElement.shadowRootOptions,

    delegatesFocus: true,
  };

  private _defaultOpen = false;
  private _open = false;

  /**
   * Whether the menu is currently open.
   *
   * In controlled mode the host owns this value; writing the property applies
   * the state silently without dispatching `rc-menu-button-toggle`.
   */
  @property({ type: Boolean, reflect: true })
  get open(): boolean {
    return this._open;
  }

  /** Applies open state in controlled mode without dispatching an event. */
  set open(value: boolean | undefined) {
    const oldValue = this._open;

    if (value === undefined) return;

    this._setOpen(value, false);
    this.requestUpdate('open', oldValue);
  }

  /**
   * Initial open state for uncontrolled mode.
   *
   * Ignored after the first controlled write; use `open` to update state
   * programmatically after mount.
   */
  @property({ type: Boolean, attribute: 'default-open' })
  get defaultOpen(): boolean {
    return this._defaultOpen;
  }

  /** Applies the uncontrolled default before any controlled write occurs. */
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
   *
   * If not set, inherits from a parent rc-menubar or element with role="menubar".
   */
  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' | undefined;

  /** Preferred placement of the popup relative to the trigger button. */
  @property({ reflect: true })
  placement: AnchorPlacement = 'bottom-start';

  /**
   * Popup placement adjusted for orientation.
   *
   * Switches from `bottom-start` to `right-start` when the resolved orientation
   * is `vertical`, so vertical menubars open submenus to the side.
   */
  protected get _effectivePlacement(): AnchorPlacement {
    if (this.placement !== 'bottom-start') {
      return this.placement;
    }

    return this._resolvedOrientation === 'vertical' ? 'right-start' : this.placement;
  }

  /**
   * Resolved orientation, considering inheritance from parent menubar.
   * Falls back to 'horizontal' if no orientation is set or inherited.
   */
  protected get _resolvedOrientation(): 'horizontal' | 'vertical' {
    if (this.orientation) {
      return this.orientation;
    }

    const $menubar = this.closest('rc-menubar, [role="menubar"]');

    if ($menubar) {
      const orientation =
        $menubar.getAttribute('orientation') ?? $menubar.getAttribute('aria-orientation');

      if (orientation === 'vertical') {
        return 'vertical';
      }

      if (orientation === 'horizontal') {
        return 'horizontal';
      }
    }

    return 'horizontal';
  }

  /** Shadow DOM root container. Serves as the anchor element for `_anchorCtrl`. */
  @query('#root') protected _$root!: HTMLElement;

  /** Shadow DOM popup container. Hidden when `open` is `false`. */
  @query('#popup') protected _$popup!: HTMLElement;

  /** Weak reference to the slotted trigger button. */
  @state()
  protected _$trigger: WeakRef<HTMLElement> | undefined;

  /** Weak reference to the slotted `rc-menu` element. */
  @state()
  protected _$menu: WeakRef<RCMenu> | undefined;

  /** Positions the popup relative to the trigger using CSS anchor positioning. */
  protected _anchorCtrl = new AnchorController(this, {
    anchor: () => this._$root ?? null,
    floating: () => this._$popup ?? null,
    shadowHost: () => this,
    placement: 'bottom-start',
    offset: 2,
  });

  /** Bound handler for document click (light dismiss). Stored for `removeEventListener` pairing. */
  protected _boundHandleDocumentClick = this._handleDocumentClick.bind(this);

  /**
   * Watches the host's own `tabindex` attribute so the trigger button's
   * tabindex can be kept in sync.
   *
   * When a parent (e.g. rc-toolbar) places the
   * host under roving-tabindex management it sets/removes tabindex on the
   * host; we mirror that to the trigger so it doesn't become an independent
   * tab stop. When the host has no tabindex the trigger keeps its natural
   * tabindex=0 for standalone usage.
   */
  protected _tabObserver?: MutationObserver;

  /** Installs the tabindex mutation observer and the document-level click listener. */
  override connectedCallback() {
    super.connectedCallback();

    this._tabObserver = new MutationObserver(() => this._syncTriggerTabindex());
    this._tabObserver.observe(this, { attributes: true, attributeFilter: ['tabindex'] });

    document.addEventListener('click', this._boundHandleDocumentClick, true);

    if (this.defaultOpen) {
      this._setOpen(true, false);
    }
  }

  /** Disconnects the tabindex observer and removes the document-level click listener. */
  override disconnectedCallback() {
    this._tabObserver?.disconnect();
    this._tabObserver = undefined;

    super.disconnectedCallback();
    document.removeEventListener('click', this._boundHandleDocumentClick, true);
  }

  /**
   * Opens the menu and moves focus into it.
   *
   * @param focusTarget - which item receives initial focus when the menu opens
   */
  openMenu(focusTarget: 'first' | 'last' = 'first') {
    if (this.open) return;

    this._anchorCtrl.setOptions({ placement: this._effectivePlacement });
    this._setOpen(true, true);
    this._anchorCtrl.update();

    this.updateComplete.then(() => {
      const $menu = this._$menu?.deref();

      focusTarget === 'last' ? $menu?.focusLast() : $menu?.focusFirst();
    });
  }

  /**
   * Closes the menu.
   *
   * @param returnFocus - when `true`, returns focus to the trigger button after closing
   */
  closeMenu(returnFocus = true) {
    if (!this.open) return;

    this._setOpen(false, true);

    if (returnFocus) {
      const $trigger = this._$trigger?.deref();

      $trigger?.focus();
    }
  }

  /** Toggles the menu between open and closed. */
  toggleMenu() {
    if (this.open) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  /** Dispatches the `rc-menu-button-toggle` bubbling composed event with the current open state. */
  protected _dispatchToggle() {
    this.dispatchEvent(
      new CustomEvent<RCMenuButtonToggleEvent>('rc-menu-button-toggle', {
        bubbles: true,
        composed: true,
        detail: { open: this.open },
      }),
    );
  }

  /** Caches a weak reference to the first assigned trigger element and syncs its ARIA and tabindex state. */
  protected _handleTriggerSlotChange(e: Event) {
    const slot = e.currentTarget as HTMLSlotElement;
    const $trigger = slot.assignedElements()[0] as HTMLElement | undefined;

    if ($trigger) {
      this._$trigger = new WeakRef($trigger);
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
  protected _syncTriggerTabindex() {
    const $trigger = this._$trigger?.deref();

    if (!$trigger) return;

    if (this.getAttribute('tabindex') === '-1') {
      $trigger.setAttribute('tabindex', '-1');
    } else {
      $trigger.removeAttribute('tabindex');
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
    const $trigger = this._$trigger?.deref();

    if (!$trigger) {
      super.focus(options);
      return;
    }

    $trigger.removeAttribute('tabindex');
    $trigger.focus(options);
  }

  /** Caches a weak reference to the first assigned `rc-menu` element. */
  protected _handleMenuSlotChange(e: Event) {
    const slot = e.currentTarget as HTMLSlotElement;
    const elements = slot.assignedElements();
    const $menu = elements.find((el) => el.tagName === 'RC-MENU') as RCMenu | undefined;

    if ($menu) {
      this._$menu = new WeakRef($menu);
    }
  }

  /**
   * Keyboard navigation handler.
   *
   * Opens or closes the menu in response to arrow/Enter/Escape keys.
   **/
  protected _onNavigate = (action: KeyboardNavigationAction) => {
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

  /** Prevents the default button action and delegates to `toggleMenu`. */
  protected _handleTriggerClick(e: MouseEvent) {
    e.preventDefault();

    this.toggleMenu();
  }

  /** Closes the menu when an `rc-menu-close` event bubbles up from the popup. */
  protected _handleMenuClose() {
    this.closeMenu();
  }

  /** Closes the menu when an `rc-menu-activate` event bubbles up from the popup. */
  protected _handleMenuActivate() {
    this.closeMenu();
  }

  /** Closes the menu on clicks outside this component (light dismiss). */
  protected _handleDocumentClick(e: MouseEvent) {
    if (!this.open) {
      return;
    }

    const path = e.composedPath();

    if (path.includes(this)) {
      return;
    }

    this.closeMenu(false);
  }

  /** Syncs trigger ARIA when `open` changes; updates anchor placement when `placement` or `orientation` change. */
  protected override updated(changedProperties: Map<PropertyKey, unknown>) {
    super.updated(changedProperties);

    if (changedProperties.has('open')) {
      this._syncTriggerAria();
    }

    if (changedProperties.has('placement') || changedProperties.has('orientation')) {
      this._anchorCtrl.setOptions({ placement: this._effectivePlacement });
    }
  }

  private _setOpen(open: boolean, dispatch: boolean): void {
    if (this._open === open) {
      return;
    }

    const oldValue = this._open;

    this._open = open;

    this.requestUpdate('open', oldValue);
    this._syncTriggerAria();

    if (dispatch) {
      this._dispatchToggle();
    }
  }

  /** Writes `aria-haspopup` and `aria-expanded` to the trigger button to match the current open state. */
  protected _syncTriggerAria(): void {
    const $trigger = this._$trigger?.deref();

    if (!$trigger?.isConnected) {
      return;
    }

    $trigger.setAttribute('aria-haspopup', 'menu');
    $trigger.setAttribute('aria-expanded', String(this.open));
  }

  protected override render() {
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
          ${keyInteraction()}
          @click=${this._handleTriggerClick}
        >
          <slot name="trigger" @slotchange=${this._handleTriggerSlotChange}></slot>
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
