import { css } from 'lit';

export const fabMenuStyles = css`
  :host {
    position: var(--rc-fab-menu-position-css, fixed);
    inset-block-end: var(--rc-fab-menu-inset-block, var(--rc-fab-inset-block, 1.5rem));
    inset-inline-end: var(--rc-fab-menu-inset-inline, var(--rc-fab-inset-inline, 1.5rem));
    z-index: var(--rc-fab-menu-z-index, var(--rc-fab-z-index, 10));
    display: inline-block;
  }

  :host([hidden]) {
    display: none;
  }

  :host([position='bottom-start']) {
    inset-inline-end: unset;
    inset-inline-start: var(--rc-fab-menu-inset-inline, var(--rc-fab-inset-inline, 1.5rem));
  }

  :host([position='top-end']) {
    inset-block-end: unset;
    inset-block-start: var(--rc-fab-menu-inset-block, var(--rc-fab-inset-block, 1.5rem));
  }

  :host([position='top-start']) {
    inset-block-end: unset;
    inset-block-start: var(--rc-fab-menu-inset-block, var(--rc-fab-inset-block, 1.5rem));
    inset-inline-end: unset;
    inset-inline-start: var(--rc-fab-menu-inset-inline, var(--rc-fab-inset-inline, 1.5rem));
  }

  #root {
    display: inline-block;
  }

  #trigger-wrap {
    display: contents;
  }

  slot[name='trigger']::slotted(button),
  slot[name='trigger']::slotted([role='button']) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--rc-fab-menu-trigger-gap, var(--rc-fab-gap, 0.5rem));
    min-inline-size: var(--rc-fab-menu-size, var(--rc-fab-size, 3.5rem));
    min-block-size: var(--rc-fab-menu-size, var(--rc-fab-size, 3.5rem));
    padding-block: 0;
    padding-inline: var(--rc-fab-menu-padding-inline, var(--rc-fab-padding-inline, 1rem));
    appearance: none;
    box-sizing: border-box;
    border: var(--rc-fab-menu-border, 0);
    border-radius: var(--rc-fab-menu-radius, var(--rc-fab-radius, 9999px));
    background: var(--rc-fab-menu-bg, var(--rc-fab-bg, ButtonFace));
    color: var(--rc-fab-menu-color, var(--rc-fab-color, ButtonText));
    box-shadow: var(--rc-fab-menu-shadow, var(--rc-fab-shadow, var(--rc-shadow-level2, none)));
    font: inherit;
    font-family: var(--rc-fab-menu-font-family, var(--rc-fab-font-family, inherit));
    font-size: var(--rc-fab-menu-font-size, var(--rc-fab-font-size, 0.875rem));
    font-weight: var(--rc-fab-menu-font-weight, var(--rc-fab-font-weight, 500));
    letter-spacing: var(--rc-fab-menu-letter-spacing, var(--rc-fab-letter-spacing, 0.00625em));
    white-space: nowrap;
    text-decoration: none;
    cursor: pointer;
    user-select: none;
    transition:
      background var(--rc-fab-menu-transition-duration, var(--rc-fab-transition-duration, 200ms))
        ease,
      box-shadow var(--rc-fab-menu-transition-duration, var(--rc-fab-transition-duration, 200ms))
        ease,
      transform var(--rc-fab-menu-transition-duration, var(--rc-fab-transition-duration, 200ms))
        ease;
  }

  slot[name='trigger']::slotted(button:hover),
  slot[name='trigger']::slotted([role='button']:hover) {
    background: var(
      --rc-fab-menu-bg-hover,
      var(--rc-fab-bg-hover, var(--rc-fab-menu-bg, var(--rc-fab-bg, ButtonFace)))
    );
    box-shadow: var(
      --rc-fab-menu-shadow-hover,
      var(--rc-fab-shadow-hover, var(--rc-fab-menu-shadow, var(--rc-fab-shadow, none)))
    );
  }

  slot[name='trigger']::slotted(button[aria-expanded='true']),
  slot[name='trigger']::slotted([role='button'][aria-expanded='true']) {
    background: var(
      --rc-fab-menu-bg-open,
      var(--rc-fab-menu-bg-hover, var(--rc-fab-bg-hover, var(--rc-fab-menu-bg, ButtonFace)))
    );
    box-shadow: var(
      --rc-fab-menu-shadow-open,
      var(--rc-fab-menu-shadow-hover, var(--rc-fab-shadow-hover, var(--rc-fab-menu-shadow, none)))
    );
  }

  slot[name='trigger']::slotted(button:active),
  slot[name='trigger']::slotted([role='button']:active) {
    box-shadow: var(--rc-fab-menu-shadow-active, var(--rc-fab-shadow-active, none));
    transform: var(--rc-fab-menu-active-transform, scale(0.96));
  }

  slot[name='trigger']::slotted(button:focus-visible),
  slot[name='trigger']::slotted([role='button']:focus-visible) {
    outline: var(--rc-fab-menu-focus-ring, var(--rc-fab-focus-ring, 2px solid currentColor));
    outline-offset: var(--rc-fab-menu-focus-ring-offset, var(--rc-fab-focus-ring-offset, 2px));
  }

  slot[name='trigger']::slotted(button:disabled),
  slot[name='trigger']::slotted([role='button'][aria-disabled='true']) {
    opacity: var(--rc-fab-menu-disabled-opacity, var(--rc-fab-disabled-opacity, 0.38));
    pointer-events: none;
    box-shadow: none;
  }

  #popup {
    z-index: var(--rc-fab-menu-popup-z-index, var(--rc-menu-button-popup-z-index, 1000));
    opacity: 1;
    scale: 1;
    transform-origin: var(--rc-fab-menu-popup-transform-origin, bottom right);
    transition:
      opacity var(--rc-fab-menu-popup-duration, 160ms) ease,
      scale var(--rc-fab-menu-popup-duration, 160ms) ease;
  }

  #popup[hidden] {
    display: none;
  }

  @starting-style {
    :host([open]) #popup {
      opacity: 0;
      scale: 0.92;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    slot[name='trigger']::slotted(button),
    slot[name='trigger']::slotted([role='button']),
    #popup {
      transition-duration: 0s;
    }

    slot[name='trigger']::slotted(button:active),
    slot[name='trigger']::slotted([role='button']:active) {
      transform: none;
    }
  }
`;

export default fabMenuStyles;
