import { css } from 'lit';

export const menuStyles = css`
  :host {
    display: block;
  }

  #root {
    display: flex;
    flex-direction: column;
    min-width: var(--rc-menu-min-width, 10em);
    padding-block: var(--rc-menu-padding-block, var(--rc-control-padding-block, 0.25em));
    background: var(--rc-menu-background, var(--rc-surface, Canvas));
    border: var(--rc-menu-border, var(--rc-border, 1px solid ButtonBorder));
    border-radius: var(--rc-menu-radius, var(--rc-control-radius, 0));
    box-shadow: var(--rc-menu-shadow, var(--rc-shadow, 0 2px 8px color-mix(in srgb, CanvasText 15%, transparent)));
    color: var(--rc-menu-color, var(--rc-field-text, CanvasText));
    font-family: var(--rc-font-family, inherit);
    font-size: var(--rc-font-size, inherit);
    line-height: var(--rc-line-height, normal);
    overflow: hidden;

    /* Focus styling for keyboard navigation */
    &[data-interaction-mode='keyboard']:focus-within {
      outline: var(--rc-focus-ring, auto);
      outline-offset: var(--rc-focus-ring-offset, 0);
    }
  }

  #slot-wrap {
    display: contents;
  }

  ::slotted(button),
  ::slotted([role='menuitem']),
  ::slotted([role='menuitemradio']),
  ::slotted([role='menuitemcheckbox']) {
    display: flex;
    align-items: center;
    gap: var(--rc-menu-item-gap, var(--rc-item-gap, 0.5em));
    width: 100%;
    text-align: start;
    padding: var(--rc-menu-item-padding-block, var(--rc-item-padding-block, 0.3em))
      var(--rc-menu-item-padding-inline, var(--rc-item-padding-inline, 0.75em));
  }

  ::slotted(svg),
  ::slotted(img) {
    flex: 0 0 auto;
    inline-size: var(--rc-menu-icon-size, 1.2em);
    block-size: var(--rc-menu-icon-size, 1.2em);
    max-inline-size: var(--rc-menu-icon-size, 1.2em);
    max-block-size: var(--rc-menu-icon-size, 1.2em);
  }

  ::slotted(button:disabled),
  ::slotted([aria-disabled='true']) {
    color: var(--rc-menu-disabled-color, var(--rc-text-disabled, GrayText));
    opacity: var(--rc-menu-disabled-opacity, var(--rc-disabled-opacity, 0.55));
    cursor: default;
  }

  /* Groups stack their children vertically and stretch them to full width. */
  ::slotted([role='group']) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  ::slotted([role='separator']),
  ::slotted(hr) {
    border: none;
    border-block-start: var(--rc-menu-separator-border, var(--rc-border, 1px solid ButtonBorder));
    margin-block: var(--rc-menu-separator-margin-block, var(--rc-control-gap, 0.25em));
  }
`;

export default menuStyles;
