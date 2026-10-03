import { css } from 'lit';

export const chipGroupStyles = css`
  :host {
    display: block;
    min-inline-size: 0;
    color-scheme: inherit;
  }

  :host([hidden]) {
    display: none;
  }

  #root {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--rc-chip-group-row-gap, 0) var(--rc-chip-group-column-gap, 0.5rem);
    min-inline-size: 0;
    padding-block: var(--rc-chip-group-padding-block, 0);
  }

  #root[data-mode='scroll'] {
    flex-wrap: nowrap;
    /* Physical fallback first, for engines without logical overflow. */
    overflow-x: auto;
    overflow-y: hidden;
    overflow-inline: auto;
    overflow-block: hidden;
    overscroll-behavior-inline: contain;
    scroll-padding-inline: var(--rc-chip-group-scroll-padding-inline, 0);
    scrollbar-width: var(--rc-chip-group-scrollbar-width, none);
    -webkit-overflow-scrolling: touch;
  }

  #root[data-mode='scroll']::-webkit-scrollbar {
    display: var(--rc-chip-group-scrollbar-display, none);
  }

  #root[data-measuring] {
    flex-wrap: wrap;
    overflow: hidden;
  }

  #slot-wrap {
    display: contents;
  }

  ::slotted(*) {
    flex: 0 0 auto;
  }

  /*
   * A readonly chip drops its touch-target minimum, but the disclosure toggle
   * keeps its own, so wrapped rows would otherwise alternate between the
   * toggle's pitch and the compact chip's. Matching the touch target keeps
   * every row on one pitch, the spacing that row-gap 0 themes rely on.
   */
  ::slotted(rc-chip[readonly]) {
    min-block-size: var(--rc-chip-touch-target-block-size, 3rem);
  }

  #toggle-wrap {
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    gap: var(--rc-chip-group-toggle-separator-gap, 0.5rem);
    order: -1;
  }

  #toggle-wrap[hidden] {
    display: none;
  }

  #toggle {
    --rc-chip-gap: var(--rc-chip-group-toggle-gap, 0.5rem);
  }

  #toggle > button {
    white-space: nowrap;
  }

  [part='toggle-icon'] {
    display: block;
    flex: 0 0 auto;
    inline-size: var(--rc-chip-group-toggle-icon-size, 1.125rem);
    block-size: var(--rc-chip-group-toggle-icon-size, 1.125rem);
  }

  [part='toggle-separator'] {
    flex: 0 0 auto;
    inline-size: var(--rc-chip-group-toggle-separator-inline-size, 1px);
    block-size: var(--rc-chip-group-toggle-separator-block-size, 1.5rem);
    background: var(--rc-chip-group-toggle-separator-color, currentColor);
  }

  @media (forced-colors: active) {
    #root[data-mode='scroll'] {
      scrollbar-width: auto;
    }

    [part='toggle-separator'] {
      background: CanvasText;
    }
  }
`;

export default chipGroupStyles;
