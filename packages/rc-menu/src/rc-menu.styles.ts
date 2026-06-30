import { css } from 'lit';

export const menuStyles = css`
  :host {
    display: flex;
    flex-direction: column;
    min-width: var(--rc-menu-min-width, 10em);
    padding-block: var(--rc-menu-padding-block, var(--rc-control-padding-block, 0.25em));
    background: var(--rc-menu-background, var(--rc-surface, Canvas));
    border: var(--rc-menu-border, var(--rc-border, 1px solid ButtonBorder));
    border-radius: var(--rc-menu-radius, var(--rc-control-radius, 0));
    box-shadow: var(
      --rc-menu-shadow,
      var(--rc-shadow, 0 2px 8px color-mix(in srgb, CanvasText 15%, transparent))
    );
    color: var(--rc-menu-color, var(--rc-field-text, CanvasText));
    font-family: var(--rc-font-family, inherit);
    font-size: var(--rc-font-size, inherit);
    line-height: var(--rc-line-height, normal);
    overflow: hidden;
  }

  :host(:focus-visible) {
    outline: var(--rc-focus-ring, auto);
    outline-offset: var(--rc-focus-ring-offset, 0);
  }
`;

export default menuStyles;
