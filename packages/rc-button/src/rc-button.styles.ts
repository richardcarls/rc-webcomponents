import { css } from 'lit';

export const buttonStyles = css`
  :host {
    position: relative;
    display: inline-grid;
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  :host([full-width]) {
    display: grid;
    inline-size: 100%;
  }

  ::slotted(button) {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--rc-button-gap);
    min-block-size: var(--rc-button-block-size);
    min-inline-size: var(--rc-button-min-inline-size);
    inline-size: var(--rc-button-inline-size);
    padding-block: var(--rc-button-padding-block, revert);
    padding-inline: var(--rc-button-padding-inline, revert);
    border: var(--rc-button-border, revert);
    border-radius: var(--rc-button-radius, revert);
    background: var(--rc-button-bg, revert);
    color: var(--rc-button-color, revert);
    box-shadow: var(--rc-button-shadow, revert);
    font: var(--rc-button-font, revert);
    white-space: nowrap;
    overflow: hidden;
    box-sizing: border-box;
    z-index: 0;
    transition: var(--rc-button-transition, revert);
  }

  :host([full-width]) ::slotted(button) {
    inline-size: 100%;
  }

  :host([icon-only]) ::slotted(button) {
    inline-size: var(
      --rc-button-icon-size,
      var(--rc-button-block-size, var(--rc-control-block-size, 2.5rem))
    );
    min-inline-size: var(
      --rc-button-icon-size,
      var(--rc-button-block-size, var(--rc-control-block-size, 2.5rem))
    );
    padding-inline: 0;
  }

  :host([disabled]) ::slotted(button),
  :host([pending]) ::slotted(button),
  :host([progress]) ::slotted(button) {
    cursor: default;
  }

  :host([disabled]) ::slotted(button) {
    opacity: var(--rc-button-disabled-opacity, revert);
  }

  [part='state-layer'],
  [part='progress'] {
    position: absolute;
    inset: 0;
    border-radius: var(--rc-button-radius, 0);
    pointer-events: none;
  }

  [part='state-layer'] {
    overflow: hidden;
    z-index: 1;
  }

  [part='state-layer']::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--rc-button-state-layer-bg, currentColor);
    opacity: 0;
    transition: opacity var(--rc-button-state-layer-duration, 150ms)
      var(--rc-button-state-layer-easing, ease);
  }

  [part='state-layer']::after {
    content: '';
    position: absolute;
    inset-inline-start: var(--_rc-button-ripple-x, 50%);
    inset-block-start: var(--_rc-button-ripple-y, 50%);
    inline-size: var(--_rc-button-ripple-size, 0);
    block-size: var(--_rc-button-ripple-size, 0);
    border-radius: 50%;
    background: var(--_rc-button-ripple-color, currentColor);
    opacity: 0;
    pointer-events: none;
    translate: -50% -50%;
    scale: 0;
  }

  [part='state-layer'][data-rippling]::after {
    animation: rc-button-ripple var(--_rc-button-ripple-duration, 0ms)
      var(--_rc-button-ripple-easing, ease-out);
  }

  :host(:hover:not([disabled]):not([pending]):not([progress])) [part='state-layer']::before {
    opacity: var(--rc-button-hover-state-layer-opacity, 0);
  }

  :host(:focus-within:not([disabled])) [part='state-layer']::before {
    opacity: var(--rc-button-focus-state-layer-opacity, 0);
  }

  :host(:active:not([disabled]):not([pending]):not([progress])) [part='state-layer']::before {
    opacity: var(--rc-button-pressed-state-layer-opacity, 0);
  }

  [part='progress'] {
    display: none;
    place-items: center;
    color: var(--rc-button-progress-color, currentColor);
    z-index: 2;
  }

  :host([pending]) [part='progress'],
  :host([progress]) [part='progress'] {
    display: grid;
  }

  [part='progress']::before {
    content: '';
    box-sizing: border-box;
    inline-size: var(--rc-button-progress-size, 1.25rem);
    block-size: var(--rc-button-progress-size, 1.25rem);
    border: var(--rc-button-progress-track-width, 2px) solid
      var(--rc-button-progress-track-color, color-mix(in srgb, currentColor 24%, transparent));
    border-block-start-color: var(--rc-button-progress-active-color, currentColor);
    border-radius: 9999px;
    animation: rc-button-progress-spin 900ms linear infinite;
  }

  @keyframes rc-button-progress-spin {
    to {
      rotate: 1turn;
    }
  }

  @keyframes rc-button-ripple {
    from {
      opacity: var(--_rc-button-ripple-opacity, 0);
      scale: 0;
    }

    70% {
      opacity: var(--_rc-button-ripple-opacity, 0);
    }

    to {
      opacity: 0;
      scale: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [part='state-layer'][data-rippling]::after {
      animation-duration: 0ms;
    }

    [part='progress']::before {
      animation-duration: 2s;
    }
  }

  @media (forced-colors: active) {
    ::slotted(button) {
      border-color: ButtonBorder;
      background: ButtonFace;
      color: ButtonText;
    }

    [part='state-layer']::before {
      background: Highlight;
    }
  }
`;

export default buttonStyles;
