import { css } from 'lit';

export const scrollerStyles = css`
  :host {
    display: block;
    min-inline-size: 0;
    min-block-size: 0;
    overflow-inline: hidden;
    overflow-block: auto;
    overscroll-behavior-block: var(--rc-scroller-overscroll-behavior, contain);
    overflow-anchor: var(--rc-scroller-overflow-anchor, auto);
    scrollbar-width: var(--rc-scroller-scrollbar-width, auto);
    scrollbar-color: var(--rc-scroller-scrollbar-color, auto);
    box-sizing: border-box;
  }

  :host([hidden]) {
    display: none;
  }

  :host([axis='inline']) {
    overflow-inline: auto;
    overflow-block: hidden;
    overscroll-behavior-inline: var(--rc-scroller-overscroll-behavior, contain);
    overscroll-behavior-block: auto;
  }

  :host([axis='both']) {
    overflow-inline: auto;
    overflow-block: auto;
    overscroll-behavior: var(--rc-scroller-overscroll-behavior, contain);
  }

  [part='content'] {
    display: block;
    min-inline-size: 0;
    min-block-size: 0;
    box-sizing: border-box;
  }

  :host([layout='content']) [part='content'] {
    display: grid;
    grid-template-columns:
      [fullbleed-start] minmax(var(--rc-scroller-content-padding-inline, 1rem), 1fr)
      [content-start] minmax(0, var(--rc-scroller-content-max-inline-size, 100%))
      [content-end] minmax(var(--rc-scroller-content-padding-inline, 1rem), 1fr)
      [fullbleed-end];
    grid-auto-rows: min-content;
    row-gap: var(--rc-scroller-content-row-gap, 0);
  }

  :host([layout='content']) ::slotted(*) {
    grid-column: content;
    min-inline-size: 0;
  }

  :host([layout='content']) ::slotted([data-rc-scroller-span='fullbleed']) {
    grid-column: fullbleed;
    inline-size: 100%;
  }
`;

export default scrollerStyles;
