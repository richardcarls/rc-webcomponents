import { css } from 'lit';

export const fabStyles = css`
  :host {
    display: inline-flex;
  }

  :host([hidden]) {
    display: none;
  }

  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--rc-fab-gap, 0.5rem);

    min-width: var(--rc-fab-size, 3.5rem);
    height: var(--rc-fab-size, 3.5rem);
    padding-block: 0;
    padding-inline: var(--rc-fab-padding-inline, 1rem);

    background: var(--rc-fab-bg, Canvas);
    color: var(--rc-fab-color, CanvasText);

    border: none;
    border-radius: var(--rc-fab-radius, 1rem);
    box-shadow: var(--rc-fab-shadow, 0 3px 8px rgb(0 0 0 / 0.3));

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

    &:hover {
      background: var(--rc-fab-bg-hover, var(--rc-fab-bg, Canvas));
      box-shadow: var(--rc-fab-shadow-hover, 0 6px 16px rgb(0 0 0 / 0.3));
    }

    &:active {
      box-shadow: var(--rc-fab-shadow-active, 0 2px 4px rgb(0 0 0 / 0.3));
      transform: scale(0.96);
    }

    &:focus-visible {
      outline: var(--rc-fab-focus-ring, 2px solid currentColor);
      outline-offset: var(--rc-fab-focus-ring-offset, 2px);
    }

    &:disabled {
      opacity: 0.38;
      pointer-events: none;
      box-shadow: none;
    }
  }

  /* Regular variant: icon-only, square-ish with equal padding */
  :host([variant='regular']) button {
    padding-inline: 0;
  }

  #label {
    display: none;
  }

  /* Extended variant: icon + label */
  :host([variant='extended']) #label {
    display: inline;
  }

  slot[name='icon']::slotted(*) {
    font-size: var(--rc-fab-icon-size, 1.5rem);
    flex-shrink: 0;
  }
`;

export default fabStyles;
