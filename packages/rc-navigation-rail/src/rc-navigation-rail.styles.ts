import { css } from 'lit';

export const navigationRailStyles = css`
  :host {
    display: inline-flex;
    color-scheme: inherit;
    color: var(--rc-navigation-rail-color, CanvasText);
    background: var(--rc-navigation-rail-bg, Canvas);
  }

  :host([hidden]) {
    display: none;
  }

  #root {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: var(--rc-navigation-rail-gap, 0.75rem);
    inline-size: var(--rc-navigation-rail-inline-size, 5rem);
    min-block-size: 0;
    padding-block: var(--rc-navigation-rail-padding-block, 0.75rem);
    padding-inline: var(--rc-navigation-rail-padding-inline, 0.5rem);
    box-sizing: border-box;
    overflow: hidden auto;
    transition:
      inline-size var(--rc-navigation-rail-duration, 200ms) var(--rc-navigation-rail-easing, ease),
      padding var(--rc-navigation-rail-duration, 200ms) var(--rc-navigation-rail-easing, ease);
  }

  :host([expanded]) #root {
    inline-size: var(--rc-navigation-rail-expanded-inline-size, 16rem);
  }

  #toggle-wrap,
  #header,
  #footer {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  :host([expanded]) #toggle-wrap,
  :host([expanded]) #header,
  :host([expanded]) #footer {
    align-items: stretch;
  }

  #toggle-wrap {
    min-block-size: var(--rc-navigation-rail-toggle-size, 3rem);
  }

  #toggle-wrap[hidden],
  #header[hidden],
  #footer[hidden] {
    display: none;
  }

  #default-toggle {
    display: inline-grid;
    place-items: center;
    inline-size: var(--rc-navigation-rail-toggle-size, 3rem);
    block-size: var(--rc-navigation-rail-toggle-size, 3rem);
    margin-inline: auto;
    padding: 0;
    border: 0;
    border-radius: var(--rc-navigation-rail-toggle-radius, 9999px);
    background: var(--rc-navigation-rail-toggle-bg, transparent);
    color: var(--rc-navigation-rail-toggle-color, inherit);
    font: inherit;
    cursor: pointer;
    outline-offset: var(--rc-navigation-rail-focus-ring-offset, 2px);
  }

  #default-toggle:focus-visible {
    outline: var(--rc-navigation-rail-focus-ring, 2px solid Highlight);
  }

  #default-toggle:hover {
    background: var(
      --rc-navigation-rail-toggle-hover-bg,
      color-mix(in srgb, currentColor 8%, transparent)
    );
  }

  nav {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    min-block-size: 0;
  }

  slot:not([name]) {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    align-items: center;
    gap: var(--rc-navigation-rail-item-gap, 0.75rem);
  }

  :host([expanded]) slot:not([name]) {
    align-items: stretch;
  }

  ::slotted(a) {
    position: relative;
    z-index: 1;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--rc-navigation-rail-link-gap, 0.25rem);
    min-inline-size: 0;
    min-block-size: var(--rc-navigation-rail-item-min-block-size, 3.5rem);
    padding-block: var(--rc-navigation-rail-item-padding-block, 0.25rem);
    padding-inline: var(--rc-navigation-rail-item-padding-inline, 0.5rem);
    box-sizing: border-box;
    color: var(--rc-navigation-rail-item-color, inherit);
    font: inherit;
    text-align: center;
    text-decoration: none;
    outline-offset: var(--rc-navigation-rail-focus-ring-offset, 2px);
    -webkit-tap-highlight-color: transparent;
  }

  ::slotted(a:focus-visible) {
    outline: var(--rc-navigation-rail-focus-ring, 2px solid Highlight);
  }

  :host([expanded]) ::slotted(a) {
    flex-direction: row;
    justify-content: flex-start;
    min-block-size: var(--rc-navigation-rail-expanded-item-min-block-size, 3.5rem);
    padding-inline: var(--rc-navigation-rail-expanded-item-padding-inline, 1rem);
  }

  ::slotted(a[aria-current]:not([aria-current='false'])) {
    color: var(--rc-navigation-rail-active-color, var(--rc-navigation-rail-item-color, inherit));
  }

  #indicator {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: 0;
    box-sizing: border-box;
    border-radius: var(--rc-navigation-rail-indicator-radius, 9999px);
    background: var(
      --rc-navigation-rail-indicator-bg,
      color-mix(in srgb, Highlight 24%, transparent)
    );
    pointer-events: none;
    transition:
      transform var(--rc-navigation-rail-indicator-duration, 180ms)
        var(--rc-navigation-rail-indicator-easing, ease),
      inline-size var(--rc-navigation-rail-indicator-duration, 180ms)
        var(--rc-navigation-rail-indicator-easing, ease),
      block-size var(--rc-navigation-rail-indicator-duration, 180ms)
        var(--rc-navigation-rail-indicator-easing, ease),
      opacity var(--rc-navigation-rail-indicator-duration, 180ms) ease;
  }

  #indicator[hidden] {
    display: block;
    opacity: 0;
  }

  #footer {
    margin-block-start: auto;
  }

  @supports (transition-behavior: allow-discrete) {
    #root {
      transition-behavior: allow-discrete;
    }
  }

  @media (forced-colors: active) {
    #indicator {
      border: 1px solid Highlight;
      background: transparent;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    #root,
    #indicator {
      transition-duration: 0s;
    }
  }
`;

export default navigationRailStyles;
