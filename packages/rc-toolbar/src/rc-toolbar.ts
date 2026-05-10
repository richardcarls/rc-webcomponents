import { LitElement, html } from 'lit';
import { property, query } from 'lit/decorators.js';

import {
  isFocusable,
  keyNavigation,
  type KeyboardNavigationAction,
  RovingTabIndexMixin,
} from '@rcarls/rc-common';

import toolbarStyles from './rc-toolbar.styles';

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
 * @cssprop [--rc-toolbar-gap-inline=0.25em] - Gap between toolbar items
 * @cssprop [--rc-toolbar-padding-inline=calc(var(--rc-control-padding-inline) / 2)] - Horizontal padding on the toolbar container
 * @cssprop [--rc-toolbar-padding-block=calc(var(--rc-control-padding-block) / 2)] - Vertical padding on the toolbar container
 * @cssprop [--rc-toolbar-radius=var(--rc-control-radius)] - Toolbar container border radius
 * @csspart root - The toolbar container element
 */
export class RCToolbar extends RovingTabIndexMixin(LitElement) {
  static styles = [toolbarStyles];

  /** Accessible label for this toolbar. Default label is 'Toolbar'. */
  @property({ type: String })
  label = 'Toolbar';

  /** Toolbar orientation, for keyboard navigation. */
  @property({ type: String })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  @query('#root', true)
  protected _$root!: HTMLDivElement;

  private readonly _disabledObserver = new MutationObserver(() => this._syncTabStop());

  override connectedCallback(): void {
    super.connectedCallback();
    this._disabledObserver.observe(this, { attributeFilter: ['disabled'], subtree: true });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._disabledObserver.disconnect();
  }

  private _syncTabStop(): void {
    if (!this._lastFocused || isFocusable(this._lastFocused)) return;
    this._lastFocused = undefined;
    this._initItems();
  }

  protected override _initItems() {
    // Set tabindex synchronously so items are in the tab order immediately,
    // even if the document has no focus yet (focus() would be a no-op).
    super._initItems();

    // Defer focus to avoid firing focusin/focusout inside a SolidJS reactive
    // update cycle, which can cause the update to hang.
    // Guard: only restore focus when the toolbar already contains it — prevents
    // focus-stealing when a toolbar mounts inside a larger component (e.g. rc-transfer-list).
    const target = this._lastFocused ?? this.firstItem;
    queueMicrotask(() => {
      if (this.matches(':focus-within')) this.focusItem(target);
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
    }
  }

  protected override _collectItems(slot: HTMLSlotElement): Element[] {
    return slot.assignedElements().filter((el) => this._isToolbarItem(el));
  }

  private _isToolbarItem(el: Element): boolean {
    if (
      el instanceof HTMLButtonElement ||
      el instanceof HTMLInputElement ||
      el instanceof HTMLSelectElement ||
      el instanceof HTMLTextAreaElement
    ) {
      return true;
    }

    if (el instanceof HTMLAnchorElement || el instanceof HTMLAreaElement) {
      return el.hasAttribute('href');
    }

    const role = el.getAttribute('role');
    if (
      role === 'button' ||
      role === 'checkbox' ||
      role === 'link' ||
      role === 'menuitem' ||
      role === 'radio' ||
      role === 'slider' ||
      role === 'spinbutton' ||
      role === 'switch' ||
      role === 'textbox'
    ) {
      return true;
    }

    return isFocusable(el);
  }

  protected render() {
    return html`
      <div
        id="root"
        part="root"
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
