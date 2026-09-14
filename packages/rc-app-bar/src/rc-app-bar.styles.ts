import { css } from 'lit';

export const appBarStyles = css`
  :host {
    display: block;
    container-type: inline-size;
    background: var(--rc-app-bar-bg, Canvas);
    color: var(--rc-app-bar-color, CanvasText);
    box-shadow: var(--rc-app-bar-shadow, none);
    --_rc-app-bar-collapse-distance: 0px;
    --_rc-app-bar-collapse-offset: 0px;
    --rc-app-bar-collapse-progress: 0;
    --_rc-app-bar-edge-size: 0px;
    --_rc-app-bar-expanded-opacity: 1;
    --_rc-app-bar-expanded-size: 0px;
    transition: translate var(--rc-app-bar-transition-duration, 200ms) ease;
  }

  :host([data-hidden]) {
    translate: 0 -100%;
  }

  #root {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-rows:
      minmax(var(--rc-app-bar-compact-min-height, 3rem), auto)
      0;
    align-items: center;
    column-gap: var(--rc-app-bar-gap, 0.5em);
    padding-inline: var(--rc-app-bar-padding-inline, 0.75em);
    background: inherit;
    color: inherit;
  }

  /*
   * Opt-in: mirrors the leading/trailing edges (measured in JS — see
   * _measureLayout) so center content stays exactly viewport-centered
   * regardless of asymmetric side content. The default (this attribute
   * absent) instead falls through to the plain 3-column grid above, same as
   * a bare title — #center just fills the flexible middle column, capped
   * and self-centered within it via --rc-app-bar-center-max-inline-size.
   */
  :host([center-symmetric]) #root[data-has-center] {
    grid-template-columns:
      var(--_rc-app-bar-edge-size)
      minmax(0, 1fr)
      auto
      minmax(0, 1fr)
      var(--_rc-app-bar-edge-size);
  }

  #leading,
  #center,
  #trailing {
    display: flex;
    align-items: center;
    min-inline-size: 0;
  }

  #leading {
    grid-column: 1;
    grid-row: 1;
  }

  #title {
    grid-column: 2;
    grid-row: 1;
    min-inline-size: 0;
    overflow: clip;
  }

  /* M3: without a navigation icon, the headline aligns with the start
   * margin of the content below the bar, not the bar's own edge padding
   * (which is calibrated for the icon button's touch target, not bare
   * text). Only applies when the leading slot is genuinely empty — the
   * adjacent #leading.empty marker already exists for the .empty class. */
  #leading.empty + #title {
    padding-inline-start: var(--rc-app-bar-title-start-padding, 0px);
  }

  /* Compact-row title: all non-expanded states and the collapsed endpoint. */
  :host(:not([variant='expanded'])) #title ::slotted(*),
  :host([variant='expanded'][data-collapsed]) #title ::slotted(*) {
    font-size: var(--rc-app-bar-title-font-size, inherit);
  }

  /* Expanded-row title: only while uncollapsed. */
  :host([variant='expanded']:not([data-collapsed])) #title ::slotted(*) {
    font-size: var(--rc-app-bar-expanded-title-font-size, inherit);
  }

  #center {
    grid-column: 2;
    grid-row: 1;
    justify-self: center;
    /*
     * Default (uncapped): 100% of the flexible column, i.e. fills it
     * edge-to-edge, same as any other content in that column. Once a
     * consumer sets --rc-app-bar-center-max-inline-size below the column's
     * own width, this centers within the leftover space instead -- deliberately
     * not written as justify-self: stretch plus max-inline-size, which falls
     * back to start-alignment once the max-width constraint applies rather
     * than centering.
     */
    inline-size: min(100%, var(--rc-app-bar-center-max-inline-size, 100%));
  }

  #trailing {
    grid-column: 3;
    grid-row: 1;
    justify-self: end;
  }

  :host([center-symmetric]) #root[data-has-center] #center {
    grid-column: 3;
    inline-size: auto;
  }

  :host([center-symmetric]) #root[data-has-center] #trailing {
    grid-column: 5;
  }

  .empty {
    visibility: hidden;
    pointer-events: none;
  }

  :host([variant='expanded']:not([data-collapsed])) #root {
    grid-template-rows:
      minmax(var(--rc-app-bar-compact-min-height, 3rem), auto)
      var(--_rc-app-bar-expanded-size);
  }

  :host([variant='expanded']:not([data-collapsed])) #title {
    grid-column: 1 / -1;
    grid-row: 2;
    align-self: start;
    padding-block: var(--rc-app-bar-expanded-padding-block, 0.75em);
    translate: 0 var(--_rc-app-bar-collapse-offset);
    opacity: var(--_rc-app-bar-expanded-opacity);
  }

  :host([variant='expanded'][data-collapsed]) #title {
    animation: rc-app-bar-title-in var(--rc-app-bar-transition-duration, 200ms) ease;
  }

  #scroll-shadow {
    grid-column: 1 / -1;
    grid-row: 3;
    align-self: end;
    inline-size: calc(100% + 2 * var(--rc-app-bar-padding-inline, 0.75em));
    margin-inline: calc(var(--rc-app-bar-padding-inline, 0.75em) * -1);
    border-block-end: 1px solid transparent;
  }

  :host([data-scrolled]) #scroll-shadow {
    border-block-end: var(--rc-app-bar-scroll-divider, 1px solid GrayText);
  }

  @keyframes rc-app-bar-title-in {
    from {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    :host,
    :host([variant='expanded'][data-collapsed]) #title {
      transition-duration: 0s;
      animation-duration: 0s;
    }
  }

  /*
   * Narrow-viewport fallback for center-symmetric mode only -- the default
   * (center-symmetric absent) never needs this, its plain 3-column grid
   * already behaves this way at every width.
   *
   * The center-symmetric grid forces both outer columns to
   * --_rc-app-bar-edge-size px (= max of leading/trailing widths) so that the
   * center slot stays perfectly symmetric. On screens ≤ 480 px that symmetry
   * can push the total width past the viewport. Below the threshold:
   *   - leading and trailing size to their natural content width (auto)
   *   - the center slot takes all remaining space (minmax(0, 1fr))
   *   - the two inner spacer columns collapse to 0
   *
   * Grid column assignments (1 leading / 2 spacer / 3 center / 4 spacer / 5
   * trailing) are unchanged, so no JS or placement CSS needs to change.
   */
  @container (max-inline-size: 480px) {
    :host([center-symmetric]) #root[data-has-center] {
      grid-template-columns: auto 0 minmax(0, 1fr) 0 auto;
    }

    :host([center-symmetric]) #root[data-has-center] #center {
      justify-self: stretch;
      justify-content: flex-end;
      inline-size: auto;
    }
  }
`;

export default appBarStyles;
