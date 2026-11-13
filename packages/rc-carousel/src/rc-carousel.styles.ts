import { css } from 'lit';

export const carouselStyles = css`
  :host {
    display: block;
    position: relative;
    color: var(--rc-carousel-color, CanvasText);
    color-scheme: inherit;
    /*
     * Count-led sizing: whole slides share the track after the peek and the
     * gaps between them. Percentages resolve where the size is used, against
     * the track (or the host-sized fit probe, which has the same inline size).
     * An explicit --rc-carousel-slide-size replaces the derived size.
     */
    --_rc-carousel-gap: var(--rc-carousel-gap, 8px);
    --_rc-carousel-slides: var(--rc-carousel-slides-per-view, 1);
    --_rc-carousel-slide-size: var(
      --rc-carousel-slide-size,
      calc(
        (
            100% - (var(--_rc-carousel-slides) - 1) *
              var(--_rc-carousel-gap) - var(--rc-carousel-peek, 4rem)
          ) /
          var(--_rc-carousel-slides)
      )
    );
  }

  #track {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: var(--_rc-carousel-slide-size);
    column-gap: var(--_rc-carousel-gap);
    inline-size: 100%;
    block-size: 100%;
    /*
     * Slides run along the inline axis, so the track scrolls and snaps along
     * it: horizontally in horizontal text, vertically in vertical text. The
     * physical declarations are a fallback for engines without the logical
     * overflow properties.
     */
    overflow-x: auto;
    overflow-y: hidden;
    overflow-inline: auto;
    overflow-block: hidden;
    overscroll-behavior-inline: contain;
    scroll-snap-type: inline mandatory;
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

  #track.static {
    grid-auto-columns: minmax(0, 1fr);
    overflow-x: hidden;
    overflow-inline: hidden;
    scroll-snap-type: none;
  }

  .slide-size-probe {
    position: absolute;
    inline-size: var(--_rc-carousel-slide-size);
    block-size: 0;
    visibility: hidden;
    pointer-events: none;
    /*
     * In a static row nothing visible depends on the slide size, so a token
     * change repaints nothing and WebKit schedules no rendering update to
     * deliver the probe's resize. A running transition schedules one.
     */
    transition: inline-size 1ms;
  }

  [part='track']::-webkit-scrollbar {
    display: none;
  }

  :host([mouse-dragging]) #track:not(.static) {
    cursor: grab;
  }

  :host([mouse-dragging]) #track.dragging:not(.static) {
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
    gap: var(--_rc-carousel-gap);
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

  /*
   * The built-in chevrons point toward the previous and next slide, which
   * swap sides in RTL. Slotted replacement icons are the consumer's to mirror
   * or not, since not every icon is directional.
   */
  :host(:dir(rtl)) [part~='navigation-button'] svg {
    transform: scaleX(-1);
  }
`;

export default carouselStyles;
