import { LitElement, html } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';

import {
  keyNavigation,
  type KeyboardNavigationAction,
} from '@rcarls/rc-common';

import toolbarStyles from './rc-toolbar.styles';

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
    // TODO: Can't check if >= 0 since we modify tabindex
    return true;
  }

  return false;
}

declare global {
  interface HTMLElementTagNameMap {
    'rc-toolbar': RCToolbar;
  }
}

/**
 * A toolbar component, as defined in WAI-ARIA
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/
 * @slot Takes any number of child elements to display in the toolbar. Only focusable elements are navigable.
 */
@customElement('rc-toolbar')
export class RCToolbar extends LitElement {
  static styles = [toolbarStyles];

  /** Accessible label for this toolbar. Default label is 'Toolbar'. */
  @property({ type: String })
  label = 'Toolbar';

  /** Toolbar orientation, for keyboard navigation. */
  @property({ type: String })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

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

  /** Set focus to a specific slotted HTMLElement */
  focusItemAt(index: number) {
    this.focusItem(this.items.at(index));
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
    // TODO: Restore original tabindex attribute?
    this._items.forEach((ref) => {
      const el = ref.deref();

      el?.removeAttribute('tabindex');
    });

    this._items = (e.currentTarget as HTMLSlotElement)
      .assignedElements()
      .filter((el) => isFocusable(el))
      .map((el) => new WeakRef(el));

    this.focusItem(this._lastFocused ?? this.firstItem);
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
    }
  }

  protected render() {
    return html`
      <div
        id="root"
        ${keyNavigation(this._onNavigate)}
        data-interaction-mode="keyboard"
        role="toolbar"
        aria-orientation=${this.orientation}
        aria-label=${this.label}
      >
        <div id="slot-wrap" @focusin=${this._handleItemFocus}>
          <slot id="items" @slotchange=${this._onSlotChange}></slot>
        </div>
      </div>
    `;
  }
}

export default RCToolbar;
