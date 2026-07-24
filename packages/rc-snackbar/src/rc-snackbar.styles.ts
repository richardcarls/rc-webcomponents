import { css } from 'lit';

export const snackbarStyles = css`
  :host {
    position: fixed;
    inset-inline: var(--rc-snackbar-inset-inline, 1rem);
    inset-block-end: calc(
      var(--rc-snackbar-inset-block-end, 1rem) + env(safe-area-inset-bottom, 0px)
    );
    z-index: var(--rc-snackbar-z-index, 1000);
    display: none;
    justify-content: center;
    pointer-events: none;
    color-scheme: inherit;
  }

  :host([hidden]) {
    display: none;
  }

  :host([open]) {
    display: flex;
  }

  [part='surface'] {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: var(--rc-snackbar-gap, 0.5rem);
    box-sizing: border-box;
    min-block-size: var(--rc-snackbar-min-block-size, 3rem);
    inline-size: min(100%, var(--rc-snackbar-max-inline-size, 30rem));
    padding-block: var(--rc-snackbar-padding-block, 0.5rem);
    padding-inline: var(--rc-snackbar-padding-inline, 1rem);
    border-radius: var(--rc-snackbar-radius, 0.25rem);
    background: var(--rc-snackbar-bg, CanvasText);
    color: var(--rc-snackbar-color, Canvas);
    box-shadow: var(--rc-snackbar-shadow, none);
  }

  [part='message'] {
    flex: 1 1 auto;
  }

  [part='action'] {
    flex: 0 0 auto;
    display: none;
    border: 0;
    border-radius: var(--rc-snackbar-action-radius, 9999px);
    padding-block: var(--rc-snackbar-action-padding-block, 0.5rem);
    padding-inline: var(--rc-snackbar-action-padding-inline, 0.75rem);
    background: transparent;
    color: var(--rc-snackbar-action-color, Canvas);
    font: inherit;
    cursor: pointer;
  }

  :host([action-label]) [part='action'] {
    display: inline-flex;
  }

  [part='action']:focus-visible {
    outline: var(--rc-snackbar-focus-ring, 2px solid Highlight);
    outline-offset: var(--rc-snackbar-focus-ring-offset, 2px);
  }

  @media (forced-colors: active) {
    [part='surface'] {
      border: 1px solid CanvasText;
      background: CanvasText;
      color: Canvas;
    }

    [part='action'] {
      color: Highlight;
    }
  }
`;

export default snackbarStyles;
