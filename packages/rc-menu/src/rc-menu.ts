import { LitElement, html } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';

import {
  keyNavigation,
  type KeyboardNavigationAction,
} from '@rcarls/rc-common';

import menuStyles from './rc-menu.styles';

type FocusableElement =
  | HTMLAnchorElement
  | HTMLAreaElement
  | HTMLButtonElement
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

/** Returns true for focusable Elements */
function isFocusable(el?: Element | null): el is FocusableElement {
  if (el == null) {
    return false;
  }

  if (el.hasAttribute('disabled')) {
    return false;
  }

  if (
    (el instanceof HTMLAnchorElement || el instanceof HTMLAreaElement) &&
    el.hasAttribute('href')
  ) {
    return true;
  }

  if (
    el instanceof HTMLButtonElement ||
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement
  ) {
    return true;
  }

  if (el.hasAttribute('tabindex')) {
    return true;
  }

  return false;
}

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
export class RCMenu extends LitElement {
  static styles = [menuStyles];

  /** Accessible label for this menu. */
  @property({ type: String })
  label = '';

  /** The last item to have focus. */
  @state()
  protected _lastFocused: FocusableElement | undefined;

  @query('#root', true)
  protected _$root!: HTMLDivElement;

  /** Array of focusable slotted HTMLElements */
  get items(): FocusableElement[] {
    return this._items.map((ref) => ref.deref()).filter((el) => el != null);
  }

  private _items: WeakRef<FocusableElement>[] = [];

  /** First focusable slotted HTMLElement */
  get firstItem(): FocusableElement | undefined {
    return this.items.at(0);
  }

  /** Last focusable slotted HTMLElement */
  get lastItem(): FocusableElement | undefined {
    return this.items.at(-1);
  }

  /** Next focusable slotted HTMLElement, in tab-order */
  get nextItem(): FocusableElement | undefined {
    const index = this._lastFocused ? this.items.indexOf(this._lastFocused) : 0;

    return this.items.at((index + 1) % this.items.length);
  }

  /** Previous focusable slotted HTMLElement, in tab-order */
  get previousItem(): FocusableElement | undefined {
    const index = this._lastFocused ? this.items.indexOf(this._lastFocused) : 0;

    return this.items.at((index - 1) % this.items.length);
  }

  /** Set focus to a specific slotted HTMLElement */
  focusItem(item?: FocusableElement | null) {
    if (item != null) {
      item.focus();
    }
  }

  /** Set focus to a specific slotted HTMLElement by index */
  focusItemAt(index: number) {
    this.focusItem(this.items.at(index));
  }

  /** Focus the first item in the menu */
  focusFirst() {
    this.focusItem(this.firstItem);
  }

  /** Focus the last item in the menu */
  focusLast() {
    this.focusItem(this.lastItem);
  }

  protected _handleItemFocus(e: FocusEvent) {
    const $self = e.composedPath()[0] as FocusableElement;

    this._lastFocused = $self;

    // Set roving tab index
    this.items.forEach((el) => el.setAttribute('tabindex', '-1'));
    $self.setAttribute('tabindex', '0');
  }

  protected _onSlotChange(e: Event) {
    // Reset tabindex on old items
    this._items.forEach((ref) => {
      const el = ref.deref();

      el?.removeAttribute('tabindex');
    });

    this._items = (e.currentTarget as HTMLSlotElement)
      .assignedElements()
      .filter((el) => isFocusable(el))
      .map((el) => new WeakRef(el));

    // Set initial tabindex on items
    this.items.forEach((el, index) => {
      el.setAttribute('tabindex', index === 0 ? '0' : '-1');
      el.setAttribute('role', 'menuitem');
    });
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
