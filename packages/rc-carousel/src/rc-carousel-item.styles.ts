import { css } from 'lit';

export const carouselItemStyles = css`
  :host {
    display: block;
    box-sizing: border-box;
    min-inline-size: 0;
    min-block-size: 0;
    scroll-snap-align: var(--rc-carousel-item-scroll-snap-align, start);
    /*
     * Without this, a normal-speed swipe carries enough fling momentum to
     * sail past the very next item and settle two (or more) items over —
     * \`mandatory\` scroll-snap-type on the track alone only guarantees
     * landing on *a* snap point, not the nearest one. \`always\` forces the
     * browser to stop at each snap point in turn.
     */
    scroll-snap-stop: always;
    overflow: var(--rc-carousel-item-overflow, hidden);
    border-radius: var(--rc-carousel-item-border-radius, 0);
    background: var(--rc-carousel-item-background, transparent);
    color: var(--rc-carousel-item-color, CanvasText);
    color-scheme: inherit;
  }

  :host([hidden]) {
    display: none;
  }

  /*
   * Peeking/off-screen items are hidden from assistive technology (see
   * rc-carousel-item.ts's IntersectionObserver) but must stay visually and
   * interactively present — a peek is a legitimate visual affordance, not
   * decoration to strip. This only removes it from the accessibility tree
   * and, via inert, the tab sequence, matching the same technique proven
   * carousels (e.g. Shoelace's sl-carousel) use for exactly this problem.
   */
  :host([aria-hidden='true']) {
    pointer-events: none;
  }
`;

export default carouselItemStyles;
