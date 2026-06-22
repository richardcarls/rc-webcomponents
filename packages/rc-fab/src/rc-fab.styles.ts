import { css } from 'lit';

export const fabStyles = css`
  :host {
    position: fixed;
    inset-block-end: var(--rc-fab-inset-block, 1.5rem);
    inset-inline-end: var(--rc-fab-inset-inline, 1.5rem);
    z-index: var(--rc-fab-z-index, 10);
    display: inline-flex;
  }

  :host([hidden]) {
    display: none;
  }

  :host([position='bottom-start']) {
    inset-inline-end: unset;
    inset-inline-start: var(--rc-fab-inset-inline, 1.5rem);
  }

  :host([position='top-end']) {
    inset-block-end: unset;
    inset-block-start: var(--rc-fab-inset-block, 1.5rem);
  }

  :host([position='top-start']) {
    inset-block-end: unset;
    inset-block-start: var(--rc-fab-inset-block, 1.5rem);
    inset-inline-end: unset;
    inset-inline-start: var(--rc-fab-inset-inline, 1.5rem);
  }

  ::slotted(button) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--rc-fab-gap, 0.5rem);

    min-width: var(--rc-fab-size, 3.5rem);
    height: var(--rc-fab-size, 3.5rem);
    padding-block: 0;
    padding-inline: var(--rc-fab-padding-inline, 1rem);

    background: var(--rc-fab-bg, ButtonFace);
    color: var(--rc-fab-color, ButtonText);

    border: none;
    border-radius: var(--rc-fab-radius, 0.25rem);
    box-shadow: var(--rc-fab-shadow, none);

    font-family: var(--rc-fab-font-family, inherit);
    font-size: var(--rc-fab-font-size, 0.875rem);
    font-weight: var(--rc-fab-font-weight, 500);
    letter-spacing: var(--rc-fab-letter-spacing, 0.00625em);
    white-space: nowrap;

    cursor: pointer;
    transition:
      background var(--rc-fab-transition-duration, 200ms) ease,
      box-shadow var(--rc-fab-transition-duration, 200ms) ease,
      transform var(--rc-fab-transition-duration, 200ms) ease;
  }

  :host(:has(button:hover)) ::slotted(button) {
    background: var(--rc-fab-bg-hover, var(--rc-fab-bg, ButtonFace));
    box-shadow: var(--rc-fab-shadow-hover, var(--rc-fab-shadow, none));
  }

  :host(:has(button:active)) ::slotted(button) {
    box-shadow: var(--rc-fab-shadow-active, none);
    transform: scale(0.96);
  }

  :host(:has(button:focus-visible)) ::slotted(button) {
    outline: var(--rc-fab-focus-ring, 2px solid currentColor);
    outline-offset: var(--rc-fab-focus-ring-offset, 2px);
  }

  :host(:has(button:disabled)) ::slotted(button) {
    opacity: 0.38;
    pointer-events: none;
    box-shadow: none;
  }
`;

export default fabStyles;
