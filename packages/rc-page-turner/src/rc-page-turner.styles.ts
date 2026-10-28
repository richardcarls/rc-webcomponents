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
   * with the perspective a turning page rotates in. Clipped so the near edge
   * of a turning page doesn't overflow the turner while it swings.
   */
  [part~='viewport'] {
    display: grid;
    grid-template: minmax(0, 1fr) / minmax(0, 1fr);
    inline-size: 100%;
    block-size: 100%;
    overflow: clip;
    perspective: var(--rc-page-turner-perspective, 75rem);
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
