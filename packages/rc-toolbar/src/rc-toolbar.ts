import { LitElement, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';

import {
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
 * @cssprop [--rc-toolbar-padding-inline=0.25em] - Horizontal padding on the toolbar container
 * @cssprop [--rc-toolbar-padding-block=0.125em] - Vertical padding on the toolbar container
 * @csspart root - The toolbar container element
 */
@customElement('rc-toolbar')
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

  protected override _initItems() {
    // Toolbar moves real focus on slot change rather than setting tabindex
    // statically — the focusin handler updates tabindex when focus lands.
    // TODO: Restore original tabindex attribute on removed items?
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
