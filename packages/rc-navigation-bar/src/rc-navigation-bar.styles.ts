import { css } from 'lit';

export const navigationBarStyles = css`
  :host {
    display: block;
    color-scheme: inherit;
    color: var(--rc-navigation-bar-color, CanvasText);
    background: var(--rc-navigation-bar-bg, Canvas);
  }

  :host([hidden]) {
    display: none;
  }

  [part='nav'] {
    position: relative;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    min-block-size: var(--rc-navigation-bar-block-size, 4rem);
    padding-block: var(--rc-navigation-bar-padding-block, 0);
    padding-inline: var(--rc-navigation-bar-padding-inline, 0);
    overflow: hidden;
  }

  slot {
    display: flex;
    flex: 1 1 auto;
    align-items: stretch;
    justify-content: space-around;
    gap: var(--rc-navigation-bar-gap, 0);
  }

  ::slotted(a) {
    position: relative;
    z-index: 1;
    display: inline-flex;
    flex: 1 1 0;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--rc-navigation-bar-item-gap, 0.25rem);
    min-inline-size: 0;
    min-block-size: var(--rc-navigation-bar-item-min-block-size, 3rem);
    padding-block: var(--rc-navigation-bar-item-padding-block, 0.5rem);
    padding-inline: var(--rc-navigation-bar-item-padding-inline, 0.75rem);
    box-sizing: border-box;
    color: var(--rc-navigation-bar-item-color, inherit);
    font: inherit;
    text-align: center;
    text-decoration: var(--rc-navigation-bar-item-text-decoration, revert);
    outline-offset: var(--rc-navigation-bar-focus-ring-offset, 2px);
    -webkit-tap-highlight-color: transparent;
  }

  ::slotted(a:focus-visible) {
    outline: var(--rc-navigation-bar-focus-ring, revert);
  }

  ::slotted(a[aria-current]:not([aria-current='false'])) {
    color: var(--rc-navigation-bar-active-color, LinkText);
  }

  #indicator {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: 0;
    box-sizing: border-box;
    border: var(--rc-navigation-bar-indicator-border, 1px solid Highlight);
    border-radius: var(--rc-navigation-bar-indicator-radius, 0);
    background: var(--rc-navigation-bar-indicator-bg, transparent);
    pointer-events: none;
    transition:
      transform var(--rc-navigation-bar-indicator-duration, 0ms)
        var(--rc-navigation-bar-indicator-easing, ease),
      inline-size var(--rc-navigation-bar-indicator-duration, 0ms)
        var(--rc-navigation-bar-indicator-easing, ease),
      block-size var(--rc-navigation-bar-indicator-duration, 0ms)
        var(--rc-navigation-bar-indicator-easing, ease),
      opacity var(--rc-navigation-bar-indicator-duration, 0ms) ease;
  }

  #indicator[hidden] {
    display: block;
    opacity: 0;
  }

  @media (forced-colors: active) {
    #indicator {
      border: 1px solid Highlight;
      background: transparent;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    #indicator {
      transition-duration: 0s;
    }
  }
`;

export default navigationBarStyles;
