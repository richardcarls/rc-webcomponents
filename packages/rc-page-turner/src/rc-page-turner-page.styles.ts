import { css } from 'lit';

export const pageTurnerPageStyles = css`
  /*
   * Every page shares the parent viewport's single grid cell, so the stack
   * never reflows when a different page shows. A page that isn't shown skips
   * its own rendering (content-visibility) and paints nothing, its box
   * included (visibility), so a later page in source order can't cover the
   * one on top. Showing it again reuses its preserved rendering state rather
   * than rebuilding anything.
   */
  :host {
    box-sizing: border-box;
    display: block;
    grid-area: 1 / 1;
    min-inline-size: 0;
    min-block-size: 0;
    visibility: hidden;
    content-visibility: hidden;
    background: var(--rc-page-turner-page-background, Canvas);
    color: var(--rc-page-turner-page-color, CanvasText);
    /*
     * A turning page shows only its front face; past the halfway point the
     * page beneath it is what shows through.
     */
    backface-visibility: hidden;
    transform-origin: var(--_rc-page-turner-origin, center);
  }

  :host(:state(active)),
  :host(:state(revealed)),
  :host(:state(turning)) {
    visibility: visible;
    content-visibility: visible;
  }

  /*
   * The pages next to the current one keep their layout up to date without
   * painting, so the next turn in either direction only paints the arriving
   * page instead of styling and laying it out in the turn's first frame.
   */
  :host(:state(adjacent)) {
    content-visibility: visible;
  }

  /* Only for the turn: lifted above the page it uncovers, on its own layer. */
  :host(:state(turning)) {
    z-index: 1;
    will-change: transform, opacity;
  }
`;

export default pageTurnerPageStyles;
