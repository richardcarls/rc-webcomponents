import { LitElement, html } from 'lit';
import { property, query } from 'lit/decorators.js';

import {
  isFocusable,
  keyInteraction,
  keyNavigation,
  type KeyboardNavigationAction,
  RovingTabIndexMixin,
} from '@rcarls/rc-common';

import chipSetStyles from './rc-chip-set.styles.js';

declare global {
  interface HTMLElementTagNameMap {
    'rc-chip-set': RCChipSet;
  }
}

/**
 * Chip set coordinator that groups chips into one arrow-key navigable toolbar.
 *
 * @see {@link https://richardcarls.github.io/rc-webcomponents/components/rc-chip-set rc-chip-set docs}
 * @see {@link https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/ WAI-ARIA toolbar pattern}
 *
 * @slot - Chips, buttons, links, or other focusable chip-like controls.
 *
 * @csspart root - The toolbar container.
 *
 * @attr label - Accessible label for the chip set toolbar.
 * @attr orientation - Keyboard orientation: `horizontal` or `vertical`.
 */
export class RCChipSet extends RovingTabIndexMixin(LitElement) {
  static override styles = chipSetStyles;

  /** Accessible label for the chip set toolbar. */
  @property({ type: String })
  label = 'Chips';

  /** Toolbar orientation. */
  @property({ type: String, reflect: true })
  orientation: 'horizontal' | 'vertical' = 'horizontal';

  @query('#root', true)
  protected _$root!: HTMLDivElement;

  protected _onNavigate(action: KeyboardNavigationAction): void {
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
    return slot.assignedElements({ flatten: true }).flatMap((element) => {
      if (element.localName === 'rc-chip') {
        const button = element.querySelector(':scope > button');

        return button ? [button] : [];
      }

      return this._isChipSetItem(element) ? [element] : [];
    });
  }

  private _isChipSetItem(element: Element): boolean {
    if (element instanceof HTMLButtonElement) {
      return true;
    }

    if (element instanceof HTMLAnchorElement) {
      return element.hasAttribute('href');
    }

    return isFocusable(element);
  }

  protected override render() {
    return html`
      <div
        id="root"
        part="root"
        role="toolbar"
        aria-label=${this.label}
        aria-orientation=${this.orientation}
        ${keyNavigation(this._onNavigate)}
        ${keyInteraction()}
      >
        <slot id="items" @slotchange=${this._onSlotChange}></slot>
      </div>
    `;
  }
}

export default RCChipSet;
