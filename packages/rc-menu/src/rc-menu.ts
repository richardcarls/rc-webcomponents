import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';

import { ActiveDescendantController, isFocusable } from '@rcarls/rc-common';

import menuStyles from './rc-menu.styles';

declare global {
  interface HTMLElementTagNameMap {
    'rc-menu': RCMenu;
  }
}

/** Detail payload for the `rc-menu-activate` event. */
export interface RCMenuActivateEvent {
  /** The activated menu item element. */
  item: HTMLElement;

  /** The item's `data-value` or `value` attribute, or an empty string. */
  value: string;

  /** Trimmed text content of the activated item. */
  text: string;

  /** Current `aria-checked` state for checkbox/radio menu items. */
  checked?: 'true' | 'false' | 'mixed';
}

/** WAI-ARIA roles that are valid direct children of `role="menu"`. */
const MENU_ITEM_ROLES = ['menuitem', 'menuitemcheckbox', 'menuitemradio'] as const;

/** Structural CSS for light-DOM menu items, injected into the containing document or shadow root. */
const LIGHT_DOM_CSS = `
@layer rc-base {
  /* Item base layout */
  rc-menu [role='menuitem'],
  rc-menu [role='menuitemcheckbox'],
  rc-menu [role='menuitemradio'],
  rc-menu button:disabled {
    display: flex;
    align-items: center;
    gap: var(--rc-menu-item-gap, var(--rc-item-gap, 0.5em));
    min-block-size: var(--rc-menu-item-min-block-size, 0px);
    width: 100%;
    text-align: start;
    padding: var(--rc-menu-item-padding-block, var(--rc-item-padding-block, 0.3em))
      var(--rc-menu-item-padding-inline, var(--rc-item-padding-inline, 0.75em));
    appearance: none;
    box-sizing: border-box;
    border: none;
    background: transparent;
    text-decoration: none;
    color: inherit;
    font: inherit;
    cursor: default;
    user-select: none;
    outline: none;
    transition: var(--rc-menu-item-transition);
  }

  /* Pointer hover */
  rc-menu [role='menuitem']:hover,
  rc-menu [role='menuitemcheckbox']:hover,
  rc-menu [role='menuitemradio']:hover {
    background: var(--rc-menu-hover-bg, color-mix(in srgb, Highlight 8%, transparent));
    color: var(--rc-menu-hover-color, inherit);
  }

  /* Virtual cursor (set by ActiveDescendantController) */
  rc-menu [role='menuitem'][data-active],
  rc-menu [role='menuitemcheckbox'][data-active],
  rc-menu [role='menuitemradio'][data-active] {
    background: var(--rc-menu-active-bg, color-mix(in srgb, Highlight 8%, transparent));
    color: var(--rc-menu-active-color, inherit);
  }

  /* Check/radio indicator — ::before acts as a fixed-width leading column.
     Content is empty (unchecked) or a Unicode symbol (checked/mixed).
     Semantic state is conveyed by aria-checked; the visual symbol is decorative. */
  rc-menu [role='menuitemcheckbox']::before,
  rc-menu [role='menuitemradio']::before {
    content: '';
    flex: 0 0 var(--rc-menu-check-size, 1.25em);
    text-align: center;
    line-height: 1;
    color: var(--rc-menu-check-color, inherit);
  }

  rc-menu [role='menuitemcheckbox'][aria-checked='true']::before {
    content: '✓';
  }

  rc-menu [role='menuitemcheckbox'][aria-checked='mixed']::before {
    content: '−';
  }

  rc-menu [role='menuitemradio'][aria-checked='true']::before {
    content: '•';
  }

  /* Trailing label — keyboard shortcut or hint, pushed to the inline-end of the item */
  rc-menu [data-menu-shortcut] {
    margin-inline-start: auto;
    font-size: var(--rc-menu-shortcut-size, 0.8em);
    color: var(--rc-menu-shortcut-color, GrayText);
    white-space: nowrap;
  }

  /* Submenu indicator for items that open a child menu. */
  rc-menu [aria-haspopup='menu']::after,
  rc-menu [aria-haspopup='true']::after {
    content: var(--rc-menu-submenu-indicator-content, '›');
    margin-inline-start: auto;
    font-size: var(--rc-menu-submenu-indicator-size, 1em);
    color: var(--rc-menu-submenu-indicator-color, currentColor);
  }

  /* Separators */
  rc-menu [role='separator'],
  rc-menu hr {
    border: none;
    border-block-start: var(--rc-menu-separator-border, var(--rc-border, 1px solid ButtonBorder));
    margin-block: var(--rc-menu-separator-margin-block, var(--rc-control-gap, 0.25em));
    margin-inline: var(--rc-menu-separator-margin-inline, 0px);
  }

  /* Group containers */
  rc-menu [role='group'] {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  /* Optional section label (non-interactive heading above a group of items) */
  rc-menu [data-group-label] {
    padding-block: var(--rc-menu-group-label-padding-block, 0.1em);
    padding-inline: var(--rc-menu-item-padding-inline, 0.75em);
    color: var(--rc-menu-group-label-color, GrayText);
    user-select: none;
    pointer-events: none;
  }

  /* Disabled items */
  rc-menu button:disabled,
  rc-menu [aria-disabled='true'] {
    color: var(--rc-menu-disabled-color, var(--rc-text-disabled, GrayText));
    opacity: var(--rc-menu-disabled-opacity, var(--rc-disabled-opacity, 0.55));
    pointer-events: none;
  }
}
`;

/**
 * An implementation of the WAI-ARIA Menu pattern that groups native elements
 * into a menu using `aria-activedescendant` virtual cursor navigation.
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 *
 * @slot default - Menu items, groups, and separators. Supported content model:
 *   - Focusable elements (`<button>`, `<a>`, `[tabindex]`) become navigable `role="menuitem"` entries.
 *   - `role="menuitemcheckbox"` / `role="menuitemradio"` elements get a leading indicator column via `::before`;
 *     `aria-checked` is initialized when missing and updated on activation.
 *   - `role="group"` divs group related items; label them with `aria-label` or `aria-labelledby`. Optionally
 *     add a visible `[data-group-label]` element as first child of the group for section headings.
 *   - `role="separator"` / `<hr>` produce horizontal dividers between sections.
 *   - Within any item, `[data-menu-shortcut]` elements are pushed to the inline-end edge for keyboard hints.
 *   - Items with `aria-haspopup="menu"` or `aria-haspopup="true"` get a trailing submenu indicator.
 *
 * @fires rc-menu-activate - Fired when a menu item is activated via keyboard (Enter/Space) or pointer click.
 * @fires rc-menu-close - Fired when Escape is pressed.
 *
 * @cssprop [--rc-menu-min-width=10em] - Minimum width of the menu panel.
 * @cssprop [--rc-menu-padding-block=0.25em] - Block (top/bottom) padding inside the panel.
 * @cssprop [--rc-menu-background=Canvas] - Background color; falls back through --rc-surface.
 * @cssprop [--rc-menu-border=1px solid ButtonBorder] - Border; falls back through --rc-border.
 * @cssprop [--rc-menu-radius=var(--rc-control-radius)] - Menu panel border radius.
 * @cssprop [--rc-menu-shadow=0 2px 8px color-mix(in srgb, CanvasText 15%, transparent)] - Box shadow; falls back through --rc-shadow.
 * @cssprop [--rc-menu-item-min-block-size=0] - Minimum block size for menu item rows.
 * @cssprop [--rc-menu-item-padding-block=var(--rc-item-padding-block)] - Menu item block-axis padding.
 * @cssprop [--rc-menu-item-padding-inline=var(--rc-item-padding-inline)] - Menu item inline-axis padding.
 * @cssprop [--rc-menu-item-gap=var(--rc-item-gap)] - Gap between flex children inside each item.
 * @cssprop [--rc-menu-item-transition] - CSS transition applied to each item row.
 * @cssprop [--rc-menu-hover-bg=color-mix(in srgb, Highlight 8%, transparent)] - Pointer-hover background.
 * @cssprop [--rc-menu-hover-color=inherit] - Pointer-hover text color.
 * @cssprop [--rc-menu-active-bg=color-mix(in srgb, Highlight 8%, transparent)] - Virtual-cursor active background.
 * @cssprop [--rc-menu-active-color=inherit] - Virtual-cursor active text color.
 * @cssprop [--rc-menu-check-size=1.25em] - Width of the leading indicator column for checkbox/radio items.
 * @cssprop [--rc-menu-check-color=inherit] - Color of the check/radio symbol.
 * @cssprop [--rc-menu-shortcut-size=0.8em] - Font size of `[data-menu-shortcut]` labels.
 * @cssprop [--rc-menu-shortcut-color=GrayText] - Text color of `[data-menu-shortcut]` labels.
 * @cssprop [--rc-menu-submenu-indicator-content='›'] - Text content for submenu indicators.
 * @cssprop [--rc-menu-submenu-indicator-size=1em] - Font size of submenu indicators.
 * @cssprop [--rc-menu-submenu-indicator-color=currentColor] - Text color of submenu indicators.
 * @cssprop [--rc-menu-disabled-color=GrayText] - Disabled menu item text color.
 * @cssprop [--rc-menu-disabled-opacity=var(--rc-disabled-opacity)] - Disabled menu item opacity.
 * @cssprop [--rc-menu-separator-border=1px solid ButtonBorder] - Separator border.
 * @cssprop [--rc-menu-separator-margin-block=var(--rc-control-gap)] - Separator block-axis margin.
 * @cssprop [--rc-menu-separator-margin-inline=0px] - Separator inline margin; set to match item padding for inset separators.
 * @cssprop [--rc-menu-group-label-padding-block=0.1em] - Block padding on `[data-group-label]` section headings.
 * @cssprop [--rc-menu-group-label-color=GrayText] - Text color of `[data-group-label]` section headings.
 */
export class RCMenu extends LitElement {
  static styles = [menuStyles];

  private static readonly _styledRoots = new Set<Document | ShadowRoot>();

  private static _ensureBaseStyles(root: Document | ShadowRoot): void {
    if (RCMenu._styledRoots.has(root)) {
      return;
    }

    RCMenu._styledRoots.add(root);

    const style = document.createElement('style');

    style.setAttribute('data-rc-light-dom-base', 'rc-menu');
    style.textContent = LIGHT_DOM_CSS;

    if (root instanceof Document) {
      root.head.appendChild(style);
    } else {
      root.appendChild(style);
    }
  }

  /**
   * Accessible label for this menu. Synced to `aria-label` on the host.
   *
   * Prefer `aria-labelledby` for a visible label associated via ID.
   */
  @property({ type: String })
  label = '';

  protected _menuItems: Element[] = [];

  protected readonly _activeDescendantCtrl = new ActiveDescendantController(this, {
    host: () => this,
    items: () => this._menuItems,
  });

  override connectedCallback(): void {
    super.connectedCallback();

    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'menu');
    }

    this.setAttribute('tabindex', '0');
    this._syncAriaLabel();

    this.addEventListener('keydown', this._onKeydown);
    this.addEventListener('blur', this._onBlur);
    this.addEventListener('click', this._onClick);

    RCMenu._ensureBaseStyles(this.getRootNode() as Document | ShadowRoot);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();

    this.removeEventListener('keydown', this._onKeydown);
    this.removeEventListener('blur', this._onBlur);
    this.removeEventListener('click', this._onClick);
  }

  protected override updated(changed: Map<PropertyKey, unknown>): void {
    if (changed.has('label')) {
      this._syncAriaLabel();
    }
  }

  protected override render() {
    return html`<slot @slotchange=${this._onSlotChange}></slot>`;
  }

  /** All navigable menu item elements in document order. */
  get items(): readonly Element[] {
    return this._menuItems;
  }

  /** Move the virtual cursor and DOM focus to the first navigable item. */
  focusFirst(): void {
    this.focus();
    this._activeDescendantCtrl.navigateToFirst();
  }

  /** Move the virtual cursor and DOM focus to the last navigable item. */
  focusLast(): void {
    this.focus();
    this._activeDescendantCtrl.navigateToLast();
  }

  /**
   * Move the virtual cursor to a specific item.
   *
   * @param item - The element to make active. No-op when null or undefined.
   */
  focusItem(item?: Element | null): void {
    if (!item) return;
    this.focus();
    this._activeDescendantCtrl.navigateToItem(item);
  }

  /**
   * Move the virtual cursor to the item at `index`.
   *
   * @param index - Zero-based index into the navigable items array.
   */
  focusItemAt(index: number): void {
    this.focus();
    this._activeDescendantCtrl.navigateTo(index);
  }

  protected _syncAriaLabel(): void {
    if (this.label) {
      this.setAttribute('aria-label', this.label);
    } else {
      this.removeAttribute('aria-label');
    }
  }

  protected _onSlotChange(e: Event): void {
    const slot = e.currentTarget as HTMLSlotElement;

    this._menuItems = this._collectMenuItems(slot);
    this._initMenuItems();
  }

  /**
   * Collects navigable menu items from the slot, supporting `role="group"`
   * containers and skipping `role="separator"` elements.
   *
   * Direct focusable children are included as-is. Elements with
   * `role="group"` are traversed one level deep so their focusable children
   * participate in arrow-key navigation. Separators and non-focusable
   * container elements are excluded.
   */
  protected _collectMenuItems(slot: HTMLSlotElement): Element[] {
    const items: Element[] = [];

    for (const el of slot.assignedElements()) {
      const role = el.getAttribute('role');

      if (role === 'separator') continue;

      if (role === 'group') {
        for (const child of el.children) {
          if (isFocusable(child)) items.push(child);
        }
        continue;
      }

      if (isFocusable(el)) items.push(el);
    }

    return items;
  }

  protected _initMenuItems(): void {
    this._menuItems.forEach((el) => {
      const existingRole = el.getAttribute('role');

      // Preserve explicit roles; only assign the default when none is present.
      if (
        !existingRole ||
        !MENU_ITEM_ROLES.includes(existingRole as (typeof MENU_ITEM_ROLES)[number])
      ) {
        el.setAttribute('role', 'menuitem');
      }

      el.setAttribute('tabindex', '-1');

      if (
        (el.getAttribute('role') === 'menuitemcheckbox' ||
          el.getAttribute('role') === 'menuitemradio') &&
        !el.hasAttribute('aria-checked')
      ) {
        el.setAttribute('aria-checked', 'false');
      }
    });
  }

  protected _applyCheckedState(item: HTMLElement): 'true' | 'false' | 'mixed' | undefined {
    const role = item.getAttribute('role');

    if (role === 'menuitemcheckbox') {
      const checked = item.getAttribute('aria-checked') === 'true' ? 'false' : 'true';

      item.setAttribute('aria-checked', checked);

      return checked;
    }

    if (role === 'menuitemradio') {
      const group = item.closest('[role="group"]');
      const scope = group && this.contains(group) ? group : this;

      for (const radio of scope.querySelectorAll<HTMLElement>('[role="menuitemradio"]')) {
        if (radio.closest('rc-menu') === this) {
          radio.setAttribute('aria-checked', radio === item ? 'true' : 'false');
        }
      }

      return 'true';
    }

    return undefined;
  }

  protected _onKeydown = (e: KeyboardEvent): void => {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        e.stopPropagation();

        if (this._activeDescendantCtrl.activeItem) {
          this._activeDescendantCtrl.navigate(1);
        } else {
          this._activeDescendantCtrl.navigateToFirst();
        }

        break;
      }

      case 'ArrowUp': {
        e.preventDefault();
        e.stopPropagation();

        if (this._activeDescendantCtrl.activeItem) {
          this._activeDescendantCtrl.navigate(-1);
        } else {
          this._activeDescendantCtrl.navigateToLast();
        }

        break;
      }

      case 'Home': {
        e.preventDefault();
        e.stopPropagation();

        this._activeDescendantCtrl.navigateToFirst();

        break;
      }

      case 'End': {
        e.preventDefault();
        e.stopPropagation();

        this._activeDescendantCtrl.navigateToLast();

        break;
      }

      case 'Enter':
      case ' ': {
        e.preventDefault();
        e.stopPropagation();

        const active = this._activeDescendantCtrl.activeItem;

        if (active) {
          // _onClick dispatches rc-menu-activate when the synthetic click bubbles up.
          (active as HTMLElement).click();
        }

        break;
      }

      case 'Escape': {
        e.preventDefault();
        e.stopPropagation();

        this.dispatchEvent(
          new CustomEvent('rc-menu-close', {
            bubbles: true,
            composed: true,
            detail: { reason: 'escape' },
          }),
        );

        break;
      }
    }
  };

  protected _onBlur = (): void => {
    this._activeDescendantCtrl.clear();
  };

  protected _onClick = (e: MouseEvent): void => {
    const target = e.target as Element;
    const item = target.closest<HTMLElement>(
      '[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"]',
    );

    if (!item || !this.contains(item)) {
      return;
    }

    if (item.matches(':disabled, [aria-disabled="true"]')) {
      return;
    }

    const checked = this._applyCheckedState(item);

    this.dispatchEvent(
      new CustomEvent<RCMenuActivateEvent>('rc-menu-activate', {
        bubbles: true,
        composed: true,
        detail: {
          item,
          value: item.dataset.value ?? item.getAttribute('value') ?? '',
          text: item.textContent?.trim() ?? '',
          checked,
        },
      }),
    );
  };
}

export default RCMenu;
