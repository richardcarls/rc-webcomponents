import { css } from 'lit';

export const menuStyles = css`
  :host {
    display: block;
  }

  #root {
    display: flex;
    flex-direction: column;
    min-width: var(--rc-menu-min-width, 10em);
    padding-block: var(--rc-menu-padding-block, 0.25em);
    background: var(--rc-menu-background, var(--rc-surface, Canvas));
    border: var(--rc-menu-border, var(--rc-border, 1px solid ButtonBorder));
    box-shadow: var(--rc-menu-shadow, var(--rc-shadow, 0 2px 8px color-mix(in srgb, CanvasText 15%, transparent)));

    /* Focus styling for keyboard navigation */
    &[data-interaction-mode='keyboard']:focus-within {
      outline: auto;
    }
  }

  #slot-wrap {
    display: contents;
  }

  ::slotted(button),
  ::slotted([role='menuitem']) {
    display: block;
    width: 100%;
    text-align: start;
  }
`;

export default menuStyles;
