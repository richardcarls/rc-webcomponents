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
    gap: var(--rc-fab-menu-trigger-gap);
    min-inline-size: var(--rc-fab-menu-size);
    min-block-size: var(--rc-fab-menu-size);
    padding-block: var(--rc-fab-menu-padding-block, revert);
    padding-inline: var(--rc-fab-menu-padding-inline, revert);
    appearance: var(--rc-fab-menu-appearance, revert);
    box-sizing: border-box;
    border: var(--rc-fab-menu-border, revert);
    border-radius: var(--rc-fab-menu-radius, revert);
    background: var(--rc-fab-menu-bg, revert);
    color: var(--rc-fab-menu-color, revert);
    box-shadow: var(--rc-fab-menu-shadow, revert);
    font: var(--rc-fab-menu-font, revert);
    font-family: var(--rc-fab-menu-font-family, revert);
    font-size: var(--rc-fab-menu-font-size, revert);
    font-weight: var(--rc-fab-menu-font-weight, revert);
    letter-spacing: var(--rc-fab-menu-letter-spacing, revert);
    white-space: nowrap;
    text-decoration: var(--rc-fab-menu-text-decoration, revert);
    user-select: var(--rc-fab-menu-user-select, revert);
    transition: var(--rc-fab-menu-transition, revert);
  }

  slot[name='trigger']::slotted(button:hover),
  slot[name='trigger']::slotted([role='button']:hover) {
    background: var(--rc-fab-menu-bg-hover, revert);
    box-shadow: var(--rc-fab-menu-shadow-hover, revert);
  }

  slot[name='trigger']::slotted(button[aria-expanded='true']),
  slot[name='trigger']::slotted([role='button'][aria-expanded='true']) {
    background: var(--rc-fab-menu-bg-open, revert);
    box-shadow: var(--rc-fab-menu-shadow-open, revert);
  }

  slot[name='trigger']::slotted(button:active),
  slot[name='trigger']::slotted([role='button']:active) {
    box-shadow: var(--rc-fab-menu-shadow-active, revert);
    transform: var(--rc-fab-menu-active-transform, revert);
  }

  slot[name='trigger']::slotted(button:focus-visible),
  slot[name='trigger']::slotted([role='button']:focus-visible) {
    outline: var(--rc-fab-menu-focus-ring, revert);
    outline-offset: var(--rc-fab-menu-focus-ring-offset, revert);
  }

  slot[name='trigger']::slotted(button:disabled),
  slot[name='trigger']::slotted([role='button'][aria-disabled='true']) {
    opacity: var(--rc-fab-menu-disabled-opacity, revert);
    pointer-events: none;
    box-shadow: var(--rc-fab-menu-disabled-shadow, revert);
  }

  #popup {
    z-index: var(--rc-fab-menu-popup-z-index, var(--rc-menu-button-popup-z-index, 1000));
    opacity: 1;
    scale: 1;
    transform-origin: var(--rc-fab-menu-popup-transform-origin, bottom right);
    transition:
      opacity var(--rc-fab-menu-popup-duration, 0ms) ease,
      scale var(--rc-fab-menu-popup-duration, 0ms) ease;
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
