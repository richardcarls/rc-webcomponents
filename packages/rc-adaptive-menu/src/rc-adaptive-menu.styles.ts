import { css } from 'lit';

import { rcToken } from '@rcarls/rc-common';

export const adaptiveMenuStyles = css`
  :host {
    display: block;
    inline-size: fit-content;
    /*
     * Raised past 100% by exactly the overlap amount so the cap only ever
     * bounds the host's own visible content, not the content plus the
     * intentional negative-margin overhang below. Inside a shrink-to-fit
     * flex/grid ancestor (a toolbar's trailing group, for example) the
     * ancestor's own auto size already accounts for the negative margin,
     * so a plain 100% cap would re-clamp the host down to that
     * already-shrunk size and silently cancel the overlap out from under
     * it — confirmed live: with a plain 100% cap the host visibly shrank
     * instead of overlapping.
     */
    max-inline-size: calc(
      100% + var(--rc-adaptive-menu-touch-target-overlap-inline-start, 0px) +
        var(--rc-adaptive-menu-touch-target-overlap-inline-end, 0px)
    );
    min-inline-size: 0;
    /*
     * Zero by default. The overflow trigger's own touch-target inflation
     * (see #overflow-trigger-target below) is what typically leaves dead
     * space at a real edge, such as a toolbar's trailing-most control — but
     * the margin has to live on the host, not on that internal wrapper:
     * #root just lays out flush with the host's own edges, so a margin
     * placed there has no visible effect on where the host itself renders
     * in an outer flex/grid container. The host's own box is
     * fit-content-sized and is what an outer container's own trailing
     * alignment actually positions, so this is the point that needs to
     * move. A theme or consumer sets one of these on a host that sits at a
     * real edge (no neighbor on that side) to let it overlap into whatever
     * sits just outside, such as a container's own edge padding, instead of
     * also reserving layout space there — the same pattern as rc-button's
     * and rc-menu-button's own touch-target overlap tokens.
     */
    margin-inline-start: calc(-1 * var(--rc-adaptive-menu-touch-target-overlap-inline-start, 0px));
    margin-inline-end: calc(-1 * var(--rc-adaptive-menu-touch-target-overlap-inline-end, 0px));
  }

  #root {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: var(--rc-adaptive-menu-gap, ${rcToken('--rc-control-gap')});
    min-inline-size: 0;
    max-inline-size: 100%;
  }

  :host([orientation='vertical']) {
    inline-size: 100%;
  }

  :host([orientation='vertical']) #root {
    flex-direction: column;
    align-items: stretch;
    min-block-size: 0;
    inline-size: 100%;
    block-size: 100%;
  }

  #actions,
  #overflow {
    display: contents;
  }

  #overflow-trigger-target {
    position: relative;
    flex: none;
    display: grid;
    place-items: center;
    box-sizing: border-box;
    min-inline-size: var(
      --rc-adaptive-menu-touch-target-inline-size,
      var(--rc-adaptive-menu-touch-target-block-size, 3rem)
    );
    min-block-size: var(--rc-adaptive-menu-touch-target-block-size, 3rem);
  }

  #overflow-trigger {
    position: relative;
    display: inline-grid;
    place-items: center;
    box-sizing: border-box;
    min-inline-size: var(--rc-adaptive-menu-trigger-inline-size, 2.5em);
    min-block-size: var(--rc-adaptive-menu-trigger-block-size, 2.5em);
    padding: var(--rc-adaptive-menu-trigger-padding, 0.5em);
    border: var(--rc-adaptive-menu-trigger-border, 1px solid ButtonBorder);
    border-radius: var(--rc-adaptive-menu-trigger-radius, ${rcToken('--rc-control-radius')});
    background: var(--rc-adaptive-menu-trigger-background, ButtonFace);
    color: var(--rc-adaptive-menu-trigger-color, ButtonText);
    box-shadow: var(--rc-adaptive-menu-trigger-shadow, none);
    font: inherit;
    line-height: 1;
    cursor: pointer;
  }

  #overflow-trigger:hover {
    background: var(
      --rc-adaptive-menu-trigger-hover-background,
      var(--rc-adaptive-menu-trigger-background, ButtonFace)
    );
  }

  #overflow-trigger:active {
    box-shadow: var(
      --rc-adaptive-menu-trigger-active-shadow,
      var(--rc-adaptive-menu-trigger-shadow, none)
    );
  }

  #overflow-trigger::before {
    content: '';
    position: absolute;
    inset-block: calc((var(--rc-adaptive-menu-touch-target-block-size, 3rem) - 100%) / -2);
    inset-inline: calc(
      (
          var(
              --rc-adaptive-menu-touch-target-inline-size,
              var(--rc-adaptive-menu-touch-target-block-size, 3rem)
            ) -
            100%
        ) /
        -2
    );
  }

  :host(:not(:state(overflow))) #overflow-trigger-target {
    position: fixed;
    visibility: hidden;
    pointer-events: none;
  }

  #overflow-trigger:focus-visible {
    outline: ${rcToken('--rc-focus-ring')};
    outline-offset: ${rcToken('--rc-focus-ring-offset')};
  }

  #overflow-icon {
    inline-size: var(--rc-adaptive-menu-icon-size, 1.5em);
    block-size: var(--rc-adaptive-menu-icon-size, 1.5em);
    fill: currentColor;
  }

  #popup {
    position: fixed;
    display: none;
    flex-direction: column;
    box-sizing: border-box;
    min-inline-size: var(--rc-adaptive-menu-popup-min-inline-size, 10em);
    max-inline-size: var(--rc-adaptive-menu-popup-max-inline-size, calc(100dvi - 0.5rem));
    max-block-size: var(--rc-adaptive-menu-popup-max-block-size, calc(100dvb - 0.5rem));
    margin: 0;
    padding-block: var(
      --rc-adaptive-menu-popup-padding-block,
      ${rcToken('--rc-popup-padding-block')}
    );
    border: var(--rc-adaptive-menu-popup-border, ${rcToken('--rc-popup-border')});
    border-radius: var(--rc-adaptive-menu-popup-radius, ${rcToken('--rc-popup-radius')});
    background: var(--rc-adaptive-menu-popup-background, ${rcToken('--rc-popup-background')});
    box-shadow: var(
      --rc-adaptive-menu-popup-shadow,
      ${rcToken('--rc-popup-shadow')}
    );
    color: var(--rc-adaptive-menu-popup-color, ${rcToken('--rc-popup-color')});
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
  }

  #popup:is(:popover-open, [data-rc-popover-fallback-open]) {
    display: flex;
  }
`;

export default adaptiveMenuStyles;
