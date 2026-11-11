import { css } from 'lit';

import { rcToken } from '@rcarls/rc-common';

export const menuStyles = css`
  :host {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    min-width: var(--rc-menu-min-width, 10em);
    padding-block: var(--rc-menu-padding-block, ${rcToken('--rc-popup-padding-block')});
    background: var(--rc-menu-background, ${rcToken('--rc-popup-background')});
    border: var(--rc-menu-border, ${rcToken('--rc-popup-border')});
    border-radius: var(--rc-menu-radius, ${rcToken('--rc-popup-radius')});
    box-shadow: var(--rc-menu-shadow, ${rcToken('--rc-popup-shadow')});
    color: var(--rc-menu-color, ${rcToken('--rc-popup-color')});
    font-family: ${rcToken('--rc-item-font-family')};
    font-size: ${rcToken('--rc-item-font-size')};
    font-weight: ${rcToken('--rc-item-font-weight', 'inherit')};
    line-height: ${rcToken('--rc-item-line-height')};
    letter-spacing: ${rcToken('--rc-item-letter-spacing', 'inherit')};
    max-inline-size: var(--rc-menu-max-inline-size, calc(100dvi - 0.5rem));
    max-block-size: var(--rc-menu-max-block-size, calc(100dvb - 0.5rem));
    /* No reserved scrollbar gutter: it left a dead strip at the inline end
       of every menu wherever scrollbars take space, though only a menu
       taller than its maximum ever scrolls. */
    overflow: auto;
    overscroll-behavior: contain;
  }

  :host(:focus-visible) {
    outline: ${rcToken('--rc-focus-ring')};
    outline-offset: ${rcToken('--rc-focus-ring-offset')};
  }
`;

export default menuStyles;
