import { css } from 'lit';

export const pageTurnerStyles = css`
  :host {
    display: block;
    position: relative;
    color: var(--rc-page-turner-color, CanvasText);
    color-scheme: inherit;
  }

  /*
   * One grid cell that every page shares (see rc-page-turner-page.styles.ts),
   * with the perspective a turning page rotates in. Clipped until the turner
   * resolves its flow; from then on only across the inline axis, so a page
   * folded past 90° can fall beyond the inline-start edge.
   */
  [part~='viewport'] {
    display: grid;
    grid-template: minmax(0, 1fr) / minmax(0, 1fr);
    inline-size: 100%;
    block-size: 100%;
    overflow: clip;
    perspective: var(--rc-page-turner-perspective, 75rem);
  }

  /*
   * The blank back of the turning page: the page mirrored across its own
   * center, facing the viewer only once the page has folded past 90°. Shown
   * only during a turn.
   */
  [part~='page-back'] {
    grid-area: 1 / 1;
    z-index: 1;
    visibility: hidden;
    pointer-events: none;
    background: var(--rc-page-turner-page-back-background, Canvas);
    backface-visibility: hidden;
    transform-origin: var(--_rc-page-turner-origin, center);
  }

  :host(:state(turning)) [part~='page-back'] {
    visibility: visible;
    will-change: transform;
  }

  /* A drag owns the pointer: no text selection or callout while it turns. */
  :host(:state(dragging)) [part~='viewport'] {
    -webkit-touch-callout: none;
    user-select: none;
    cursor: grabbing;
  }

  [part~='navigation'] {
    display: contents;
  }

  [part~='navigation-button'] {
    position: absolute;
    inset-block-start: 50%;
    translate: 0 -50%;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--rc-page-turner-navigation-button-size, 40px);
    block-size: var(--rc-page-turner-navigation-button-size, 40px);
    border: none;
    border-radius: 50%;
    background: var(
      --rc-page-turner-navigation-button-background,
      color-mix(in srgb, CanvasText 12%, transparent)
    );
    color: var(--rc-page-turner-navigation-button-color, CanvasText);
    cursor: pointer;
  }

  [part~='navigation-button'][aria-disabled='true'] {
    opacity: 0.38;
    cursor: default;
  }

  [part~='navigation-button-previous'] {
    inset-inline-start: var(--rc-page-turner-navigation-inset, 8px);
  }

  [part~='navigation-button-next'] {
    inset-inline-end: var(--rc-page-turner-navigation-inset, 8px);
  }

  /*
   * The built-in chevrons point toward the previous and next page, which swap
   * sides in RTL. Slotted replacement icons are the consumer's to mirror or
   * not, since not every icon is directional.
   */
  :host(:dir(rtl)) [part~='navigation-button'] svg {
    transform: scaleX(-1);
  }

  @media (forced-colors: active) {
    [part~='navigation-button'] {
      border: 1px solid ButtonText;
      background: ButtonFace;
      color: ButtonText;
    }
  }
`;

export default pageTurnerStyles;
