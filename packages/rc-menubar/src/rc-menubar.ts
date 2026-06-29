import { LitElement, html } from 'lit';
import { property, state } from 'lit/decorators.js';

import { type KeyboardNavigationAction } from '@rcarls/rc-common';

import type { RCMenuButton, RCMenuButtonToggleEvent } from '@rcarls/rc-menu-button';

import menubarStyles from './rc-menubar.styles';

declare global {
  interface HTMLElementTagNameMap {
    'rc-menubar': RCMenubar;
  }
}

const IE_KEY_ALIASES: Record<string, string> = {
  Up: 'ArrowUp',
  Down: 'ArrowDown',
  Left: 'ArrowLeft',
  Right: 'ArrowRight',
};

/**
 * Menubar coordinator for rc-menu-button children with roving tabindex and submenu
 * handoff, following the WAI-ARIA Menubar pattern.
 *
 * Uses roving tabindex rather than aria-activedescendant so trigger buttons
 * receive real focus — required for submenu handoff and screen reader announcements.
 *
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-menubar rc-menubar docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/menubar/ WAI-ARIA Menubar pattern}
 *
 * @slot default - Takes rc-menu-button elements to display in the menubar
 *
 * @csspart root - The root container element
 *
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

  /** Accessible label for the `role="menubar"` element. */
  @property({ type: String })
  label = 'Menu';

  /** Orientation of the menubar, controls which arrow keys move between items. */
  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  /** Weak reference to the currently open child `rc-menu-button`. */
  @state()
  protected _$activeMenuButton: WeakRef<RCMenuButton> | undefined;

  /** The last trigger element to have received focus, used for roving-tabindex bookkeeping. */
  @state()
  protected _$lastFocused: HTMLElement | undefined;

  /** Weak references to all slotted `rc-menu-button` children, in DOM order. */
  protected _$menuButtons: WeakRef<RCMenuButton>[] = [];

  /** Bound keydown handler, held for `removeEventListener` pairing. */
  protected _boundHandleKeydown = this._handleKeydown.bind(this);

  /** Bound click handler, held for `removeEventListener` pairing. */
  protected _boundHandleClick = this._handleClick.bind(this);

  /** Syncs host ARIA attributes and registers keyboard and click handlers. */
  override connectedCallback() {
    super.connectedCallback();

    this._syncHostAria();

    this.addEventListener('keydown', this._boundHandleKeydown);
    this.addEventListener('click', this._boundHandleClick);
  }

  /** Removes keyboard and click handlers. */
  override disconnectedCallback() {
    super.disconnectedCallback();

    this.removeEventListener('keydown', this._boundHandleKeydown);
    this.removeEventListener('click', this._boundHandleClick);
  }

  /** Syncs host ARIA and child orientation when `label` or `orientation` change. */
  protected override updated(changedProperties: Map<PropertyKey, unknown>) {
    super.updated(changedProperties);

    if (changedProperties.has('label') || changedProperties.has('orientation')) {
      this._syncHostAria();
      this._syncMenuButtonOrientation();
    }
  }

  /** Writes `role`, `aria-label`, and `aria-orientation` to the host element. */
  protected _syncHostAria(): void {
    this.setAttribute('role', 'menubar');
    this.setAttribute('aria-label', this.label);
    this.setAttribute('aria-orientation', this.orientation);
  }

  /** Propagates the current `orientation` value to all slotted `rc-menu-button` children. */
  protected _syncMenuButtonOrientation(): void {
    this.$menuButtons.forEach(($menuButton) => {
      $menuButton.orientation = this.orientation;
    });
  }

  /** Returns the `[slot="trigger"]` element inside a child `rc-menu-button`. */
  protected _$getTrigger($menuButton: RCMenuButton): HTMLElement | null {
    return $menuButton.querySelector('[slot="trigger"]');
  }

  /** All slotted trigger elements in DOM order. */
  get $items(): HTMLElement[] {
    return this._$menuButtons
      .map((ref) => ref.deref())
      .filter((el): el is RCMenuButton => el != null)
      .map(($mb) => this._$getTrigger($mb))
      .filter(($el): $el is HTMLElement => $el != null);
  }

  /** All slotted `rc-menu-button` children in DOM order. */
  get $menuButtons(): RCMenuButton[] {
    return this._$menuButtons
      .map((ref) => ref.deref())
      .filter((el): el is RCMenuButton => el != null);
  }

  /** First trigger element in the menubar. */
  get $firstItem(): HTMLElement | undefined {
    return this.$items.at(0);
  }

  /** Last trigger element in the menubar. */
  get $lastItem(): HTMLElement | undefined {
    return this.$items.at(-1);
  }

  /** Trigger after `_$lastFocused`, wrapping around to the first. */
  get $nextItem(): HTMLElement | undefined {
    const index = this._$lastFocused ? this.$items.indexOf(this._$lastFocused) : 0;

    return this.$items.at((index + 1) % this.$items.length);
  }

  /** Trigger before `_$lastFocused`, wrapping around to the last. */
  get $previousItem(): HTMLElement | undefined {
    const index = this._$lastFocused ? this.$items.indexOf(this._$lastFocused) : 0;

    return this.$items.at((index - 1) % this.$items.length);
  }

  /** Returns the `rc-menu-button` whose slotted trigger matches `$trigger`. */
  protected _$getMenuButtonForTrigger($trigger: HTMLElement): RCMenuButton | undefined {
    return this.$menuButtons.find(($mb) => this._$getTrigger($mb) === $trigger);
  }

  /**
   * Moves focus to a trigger element.
   *
   * @param item - trigger to focus; no-ops when `null` or `undefined`
   */
  focusItem(item?: HTMLElement | null) {
    if (item != null) {
      item.focus();
    }
  }

  /** Closes the currently open child menu without returning focus to its trigger. */
  closeActiveMenu() {
    const $activeMenuButton = this._$activeMenuButton?.deref();

    if ($activeMenuButton) {
      $activeMenuButton.closeMenu(false);

      this._$activeMenuButton = undefined;
    }
  }

  /** Updates roving-tabindex state when a trigger element receives focus. */
  protected _handleItemFocus(e: FocusEvent) {
    const $target = e.target as HTMLElement;

    if ($target.slot !== 'trigger') return;

    this._$lastFocused = $target;

    this.$items.forEach(($item) => $item.setAttribute('tabindex', '-1'));

    $target.setAttribute('tabindex', '0');
  }

  /** Refreshes the cached `rc-menu-button` list when slotted children change. */
  protected _handleSlotChange(e: Event) {
    const $slot = e.currentTarget as HTMLSlotElement;
    const $elements = $slot.assignedElements();

    const prevButtons = this._$menuButtons;

    // Cache element references synchronously. Defer all DOM mutations.
    // slotchange fires synchronously inside a framework reactive update pass
    // on second+ mount (shadow DOM already exists), so the handler must be
    // instantaneous to avoid interacting with the reactive system.
    this._$menuButtons = $elements
      .filter((el): el is RCMenuButton => el.tagName === 'RC-MENU-BUTTON')
      .map((el) => new WeakRef(el));

    queueMicrotask(() => {
      if (!this.isConnected) {
        return;
      }

      prevButtons.forEach((ref) => {
        const $menuButton = ref.deref();
        if (!$menuButton) {
          return;
        }

        $menuButton.removeAttribute('role');

        const $trigger = this._$getTrigger($menuButton);

        $trigger?.removeAttribute('tabindex');
        $trigger?.removeAttribute('role');
      });

      this.$menuButtons.forEach(($menuButton) => {
        $menuButton.removeAttribute('role');
        $menuButton.orientation = this.orientation;

        const $trigger = this._$getTrigger($menuButton);

        $trigger?.setAttribute('role', 'menuitem');
      });

      const $items = this.$items;

      $items.forEach(($trigger, index) => {
        $trigger.setAttribute('tabindex', index === 0 ? '0' : '-1');
      });

      if ($items.length > 0 && !this._$lastFocused) {
        this._$lastFocused = $items[0];
      }
    });
  }

  /** Tracks which child `rc-menu-button` is currently open. */
  protected _handleMenuButtonToggle(e: CustomEvent<RCMenuButtonToggleEvent>) {
    const $menuButton = e.target as RCMenuButton;

    if (e.detail.open) {
      this._$activeMenuButton = new WeakRef($menuButton);
    } else {
      if (this._$activeMenuButton?.deref() === $menuButton) {
        this._$activeMenuButton = undefined;
      }
    }
  }

  /**
   * Routes keyboard navigation actions to item focus and menu open/close changes.
   *
   * When a menu is open, moving to an adjacent item closes the current menu and
   * opens the one attached to the newly focused trigger.
   *
   * @param action - the navigation action produced by the keydown handler
   */
  protected _handleNavigate(action: KeyboardNavigationAction) {
    const $activeMenu = this._$activeMenuButton?.deref();
    const wasMenuOpen = $activeMenu?.open ?? false;

    switch (action) {
      case 'next':
        if (wasMenuOpen) {
          this.closeActiveMenu();
        }

        this.focusItem(this.$nextItem);

        if (wasMenuOpen) {
          this._openCurrentMenu();
        }

        break;

      case 'prev':
        if (wasMenuOpen) {
          this.closeActiveMenu();
        }

        this.focusItem(this.$previousItem);

        if (wasMenuOpen) {
          this._openCurrentMenu();
        }

        break;

      case 'start':
        if (wasMenuOpen) {
          this.closeActiveMenu();
        }

        this.focusItem(this.$firstItem);

        if (wasMenuOpen) {
          this._openCurrentMenu();
        }

        break;

      case 'end':
        if (wasMenuOpen) {
          this.closeActiveMenu();
        }

        this.focusItem(this.$lastItem);

        if (wasMenuOpen) {
          this._openCurrentMenu();
        }

        break;

      case 'escape':
        this.closeActiveMenu();

        break;
    }
  }

  /** Opens the menu attached to the last-focused trigger. */
  protected _openCurrentMenu() {
    if (this._$lastFocused) {
      const $menuButton = this._$getMenuButtonForTrigger(this._$lastFocused);

      if ($menuButton) {
        $menuButton.openMenu();
      }
    }
  }

  /** Translates keyboard events to navigation actions and activates keyboard interaction mode. */
  protected _handleKeydown(e: KeyboardEvent): void {
    const key = IE_KEY_ALIASES[e.key] ?? e.key;
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

    if (!action) {
      return;
    }

    this._handleNavigate(action);
    this.setAttribute('data-interaction-mode', 'keyboard');

    e.stopPropagation();
    e.preventDefault();
  }

  /** Clears keyboard interaction mode on pointer click. */
  protected _handleClick(): void {
    this.removeAttribute('data-interaction-mode');
  }

  protected override render() {
    return html`
      <div id="root" part="root">
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
