import { css } from 'lit';

export const carouselStyles = css`
  :host {
    display: block;
    position: relative;
    color: var(--rc-carousel-color, CanvasText);
    color-scheme: inherit;
  }

  #track {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: var(--rc-carousel-slide-size, calc(100% - 4rem));
    column-gap: var(--rc-carousel-gap, 8px);
    inline-size: 100%;
    block-size: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scroll-snap-type: x mandatory;
    /*
     * Deliberately no \`scroll-behavior: smooth\` here — _scrollToIndex in
     * rc-carousel.ts passes \`behavior: 'smooth'\` explicitly per
     * programmatic call instead, which is unaffected either way (an
     * explicit argument always overrides this CSS default). Setting it
     * here as an ambient default would also apply to the browser's own
     * native snap-settle correction after a swipe — a documented
     * cross-browser conflict with scroll-snap-stop: always (each
     * rc-carousel-item sets that; Firefox bugzilla 1643217, 1959811)
     * that produces a jerk-then-snap-back artifact on an ordinary swipe.
     */
    scrollbar-width: none;
  }

  #track::-webkit-scrollbar {
    display: none;
  }

  :host([variant='multi-browse']) #track {
    grid-auto-columns: var(--rc-carousel-slide-size, min(75%, 300px));
  }

  :host([mouse-dragging]) #track {
    cursor: grab;
  }

  :host([mouse-dragging]) #track.dragging {
    cursor: grabbing;
    /*
     * scroll-snap-type itself is toggled imperatively in rc-carousel.ts,
     * not here — it must be off before the very first scrollLeft write of
     * a drag, and this class only lands on the next reactive render, a
     * render pass too late for that first write (the browser eagerly
     * resnaps a plain scrollLeft assignment right back to the nearest
     * snap point, same as any other programmatic scroll).
     */
  }

  #navigation {
    display: contents;
  }

  [part~='navigation-button'] {
    position: absolute;
    top: 50%;
    translate: 0 -50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--rc-carousel-navigation-button-size, 40px);
    block-size: var(--rc-carousel-navigation-button-size, 40px);
    border: none;
    border-radius: 50%;
    background: var(
      --rc-carousel-navigation-button-background,
      color-mix(in srgb, CanvasText 12%, transparent)
    );
    color: var(--rc-carousel-navigation-button-color, CanvasText);
    cursor: pointer;
  }

  [part~='navigation-button'][aria-disabled='true'] {
    opacity: 0.38;
    cursor: default;
  }

  [part~='navigation-button-previous'] {
    inset-inline-start: var(--rc-carousel-navigation-inset, 8px);
  }

  [part~='navigation-button-next'] {
    inset-inline-end: var(--rc-carousel-navigation-inset, 8px);
  }

  #pagination {
    position: absolute;
    inset-block-end: var(--rc-carousel-navigation-inset, 8px);
    inset-inline: 0;
    display: flex;
    justify-content: center;
    gap: var(--rc-carousel-gap, 8px);
  }

  [part~='pagination-item'] {
    inline-size: var(--rc-carousel-pagination-item-size, 8px);
    block-size: var(--rc-carousel-pagination-item-size, 8px);
    padding: 0;
    border: none;
    border-radius: 50%;
    background: var(
      --rc-carousel-pagination-item-color,
      color-mix(in srgb, CanvasText 40%, transparent)
    );
    cursor: pointer;
  }

  [part~='pagination-item-active'] {
    background: var(--rc-carousel-pagination-item-active-color, Highlight);
    cursor: default;
  }
`;

export default carouselStyles;
