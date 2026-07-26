import { css } from 'lit';

export const switchStyles = css`
  :host {
    display: inline-grid;
    inline-size: var(--rc-switch-track-inline-size, 3.25rem);
    block-size: var(--rc-switch-track-block-size, 2rem);
    position: relative;
    color-scheme: inherit;
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  ::slotted(input[type='checkbox']) {
    appearance: none;
    grid-area: 1 / 1;
    inline-size: 100%;
    block-size: 100%;
    margin: 0;
    opacity: 0;
    cursor: pointer;
  }

  :host([disabled]) ::slotted(input[type='checkbox']) {
    cursor: not-allowed;
  }

  [part='track'],
  [part='thumb'],
  [part='selected-icon'],
  [part='deselected-icon'] {
    pointer-events: none;
    grid-area: 1 / 1;
  }

  [part='track'] {
    border: var(--rc-switch-track-border, 2px solid ButtonBorder);
    border-radius: var(--rc-switch-track-radius, 9999px);
    background: var(--rc-switch-track-bg, ButtonFace);
    transition:
      background-color var(--rc-switch-duration, 150ms) var(--rc-switch-easing, ease),
      border-color var(--rc-switch-duration, 150ms) var(--rc-switch-easing, ease);
  }

  [part='thumb'] {
    align-self: center;
    justify-self: start;
    inline-size: var(--rc-switch-thumb-size, 1rem);
    block-size: var(--rc-switch-thumb-size, 1rem);
    margin-inline-start: var(--rc-switch-thumb-offset, 0.375rem);
    border-radius: var(--rc-switch-thumb-radius, 9999px);
    background: var(--rc-switch-thumb-bg, ButtonText);
    transform: translateX(0);
    transition:
      background-color var(--rc-switch-duration, 150ms) var(--rc-switch-easing, ease),
      inline-size var(--rc-switch-duration, 150ms) var(--rc-switch-easing, ease),
      block-size var(--rc-switch-duration, 150ms) var(--rc-switch-easing, ease),
      transform var(--rc-switch-duration, 150ms) var(--rc-switch-easing, ease);
  }

  [part='selected-icon'],
  [part='deselected-icon'] {
    place-self: center start;
    display: none;
    inline-size: var(--rc-switch-icon-size, 1rem);
    block-size: var(--rc-switch-icon-size, 1rem);
    margin-inline-start: var(--rc-switch-thumb-offset, 0.375rem);
    color: var(--rc-switch-icon-color, Canvas);
    transform: translateX(0);
    transition: transform var(--rc-switch-duration, 150ms) var(--rc-switch-easing, ease);
  }

  :host([icons]) [part='deselected-icon'],
  :host([icons][checked]) [part='selected-icon'],
  :host([show-only-selected-icon][checked]) [part='selected-icon'] {
    display: grid;
    place-items: center;
  }

  :host([icons][checked]) [part='deselected-icon'],
  :host([show-only-selected-icon]) [part='deselected-icon'] {
    display: none;
  }

  :host([checked]) [part='track'] {
    border-color: var(--rc-switch-selected-track-border-color, Highlight);
    background: var(--rc-switch-selected-track-bg, Highlight);
  }

  :host([checked]) [part='thumb'] {
    inline-size: var(--rc-switch-selected-thumb-size, 1.5rem);
    block-size: var(--rc-switch-selected-thumb-size, 1.5rem);
    background: var(--rc-switch-selected-thumb-bg, HighlightText);
    transform: translateX(var(--rc-switch-thumb-translate, 1.125rem));
  }

  :host([checked]) [part='selected-icon'],
  :host([checked]) [part='deselected-icon'] {
    transform: translateX(var(--rc-switch-thumb-translate, 1.125rem));
  }

  :host(:focus-within) [part='track'] {
    outline: var(--rc-switch-focus-ring, 2px solid Highlight);
    outline-offset: var(--rc-switch-focus-ring-offset, 2px);
  }

  :host([disabled]) {
    opacity: var(--rc-switch-disabled-opacity, 0.5);
  }

  @media (prefers-reduced-motion: reduce) {
    [part='track'],
    [part='thumb'],
    [part='selected-icon'],
    [part='deselected-icon'] {
      transition-duration: 0ms;
    }
  }

  @media (forced-colors: active) {
    [part='track'] {
      forced-color-adjust: none;
      border-color: ButtonText;
      background: ButtonFace;
    }

    :host([checked]) [part='track'] {
      border-color: Highlight;
      background: Highlight;
    }

    [part='thumb'] {
      background: ButtonText;
    }

    :host([checked]) [part='thumb'] {
      background: HighlightText;
    }
  }
`;

export default switchStyles;
