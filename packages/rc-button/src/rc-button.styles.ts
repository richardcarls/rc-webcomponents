import { css } from 'lit';

export const buttonStyles = css`
  :host {
    position: relative;
    display: inline-grid;
    place-items: center;
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  :host([full-width]) {
    display: grid;
    inline-size: 100%;
  }

  /*
   * Icon-only buttons can render visually smaller than the accessible
   * minimum touch target (e.g. MD3's 40dp "small" icon button, or a 32dp
   * expressive extra-small size). These are floors, not fixed sizes: a
   * larger visual button (medium/large/extra-large sizes) already clears
   * them and is unaffected. The host grows to reserve the space; the
   * visible child button stays centered at its own size via place-items
   * above, and the actual larger hit region comes from the light-DOM
   * hit-slop pseudo-element in rc-button.ts. Mirrors rc-chip's
   * touch-target-block-size host-affordance pattern.
   */
  :host([icon-only]) {
    min-block-size: var(--rc-button-touch-target-block-size, 3rem);
    min-inline-size: var(
      --rc-button-touch-target-inline-size,
      var(--rc-button-touch-target-block-size, 3rem)
    );
    /*
     * Zero by default: an icon-only button's touch-target inflation reserves
     * real layout space on both sides, correct when it has real neighbors.
     * At an actual edge (e.g. a toolbar's trailing-most icon), a theme or
     * consumer sets one or both of these to let that reserved space overlap
     * into whatever sits just outside the host (typically a container's own
     * edge padding) instead of adding to it — a plain token, not something
     * this component decides on its own or exposes as a mode to switch. A
     * negative margin on that side pulls the host's own footprint back by
     * the given amount; the light-DOM hit-slop pseudo-element below is
     * unaffected by host margin and still extends the full touch target, so
     * the actual clickable region keeps its accessible size, just visually
     * overlapping the reclaimed space rather than adding to it. Only
     * sensible at an edge — setting this on a button with a real neighbor
     * on that side overlaps its touch target too.
     */
    margin-inline-start: calc(-1 * var(--rc-button-touch-target-overlap-inline-start, 0px));
    margin-inline-end: calc(-1 * var(--rc-button-touch-target-overlap-inline-end, 0px));
  }

  /*
   * a[href] alongside button: a real navigation link is a legitimate direct
   * child too (rc-menu-button and rc-adaptive-menu already treat "native
   * button or link" as one contract; rc-button's own JSDoc undersold this
   * as button-only). Scoped to this rule and the full-width one below,
   * both pure visual/layout styling with no dependency on button-specific
   * IDL state — icon-only sizing, the touch-target hit-slop pseudo, and
   * the disabled/pending/progress treatments below stay button-only since
   * those assume a real HTMLButtonElement (disabled, a live progress
   * takeover) an anchor doesn't have.
   */
  ::slotted(:is(button, a[href])) {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--rc-button-gap);
    min-block-size: var(--rc-button-block-size);
    min-inline-size: var(--rc-button-min-inline-size);
    inline-size: var(--rc-button-inline-size);
    padding-block: var(--rc-button-padding-block, revert);
    padding-inline: var(--rc-button-padding-inline, revert);
    border: var(--rc-button-border, revert);
    border-radius: var(--rc-button-radius, revert);
    background: var(--rc-button-bg, revert);
    color: var(--rc-button-color, revert);
    box-shadow: var(--rc-button-shadow, revert);
    font: var(--rc-button-font, revert);
    white-space: nowrap;
    overflow: hidden;
    box-sizing: border-box;
    z-index: 0;
    transition: var(--rc-button-transition, revert);
  }

  :host([full-width]) ::slotted(:is(button, a[href])) {
    inline-size: 100%;
  }

  :host([icon-only]) ::slotted(button) {
    inline-size: var(
      --rc-button-icon-size,
      var(--rc-button-block-size, var(--rc-control-block-size, 2.5rem))
    );
    min-inline-size: var(
      --rc-button-icon-size,
      var(--rc-button-block-size, var(--rc-control-block-size, 2.5rem))
    );
    padding-inline: 0;
    overflow: visible;
  }

  :host([disabled]) ::slotted(button),
  :host([pending]) ::slotted(button),
  :host([progress]) ::slotted(button) {
    cursor: default;
  }

  :host([pending]) ::slotted(button),
  :host([progress]) ::slotted(button) {
    color: var(--rc-button-busy-content-color, transparent);
  }

  :host([disabled]) ::slotted(button) {
    opacity: var(--rc-button-disabled-opacity, revert);
  }

  [part='state-layer'],
  [part='progress'] {
    position: absolute;
    inset: 0;
    border-radius: var(--rc-button-radius, 0);
    pointer-events: none;
  }

  [part='state-layer'] {
    overflow: hidden;
    z-index: 1;
  }

  [part='state-layer']::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--rc-button-state-layer-bg, currentColor);
    opacity: 0;
    transition: opacity var(--rc-button-state-layer-duration, 150ms)
      var(--rc-button-state-layer-easing, ease);
  }

  [part='state-layer']::after {
    content: '';
    position: absolute;
    inset-inline-start: var(--_rc-button-ripple-x, 50%);
    inset-block-start: var(--_rc-button-ripple-y, 50%);
    inline-size: var(--_rc-button-ripple-size, 0);
    block-size: var(--_rc-button-ripple-size, 0);
    border-radius: 50%;
    background: var(--_rc-button-ripple-color, currentColor);
    opacity: 0;
    pointer-events: none;
    translate: -50% -50%;
    scale: 0;
  }

  [part='state-layer'][data-rippling]::after {
    animation: rc-button-ripple var(--_rc-button-ripple-duration, 0ms)
      var(--_rc-button-ripple-easing, ease-out);
  }

  :host(:hover:not([disabled]):not([pending]):not([progress])) [part='state-layer']::before {
    opacity: var(--rc-button-hover-state-layer-opacity, 0);
  }

  :host(:focus-within:not([disabled])) [part='state-layer']::before {
    opacity: var(--rc-button-focus-state-layer-opacity, 0);
  }

  :host(:active:not([disabled]):not([pending]):not([progress])) [part='state-layer']::before {
    opacity: var(--rc-button-pressed-state-layer-opacity, 0);
  }

  [part='progress'] {
    display: none;
    place-items: center;
    color: var(--rc-button-progress-color, currentColor);
    font: var(--rc-button-progress-font, 600 0.75rem / 1 sans-serif);
    font-variant-numeric: tabular-nums;
    z-index: 2;
  }

  :host([pending]) [part='progress'],
  :host([progress]) [part='progress'] {
    display: grid;
  }

  [part='progress']::before {
    content: '';
    box-sizing: border-box;
    inline-size: var(--rc-button-progress-size, 1.25rem);
    block-size: var(--rc-button-progress-size, 1.25rem);
    border: var(--rc-button-progress-track-width, 2px) solid
      var(--rc-button-progress-track-color, color-mix(in srgb, currentColor 24%, transparent));
    border-block-start-color: var(--rc-button-progress-active-color, currentColor);
    border-radius: 9999px;
    animation: rc-button-progress-spin 900ms linear infinite;
  }

  [part='progress'][data-determinate]::before {
    display: none;
  }

  @keyframes rc-button-progress-spin {
    to {
      rotate: 1turn;
    }
  }

  @keyframes rc-button-ripple {
    from {
      opacity: var(--_rc-button-ripple-opacity, 0);
      scale: 0;
    }

    70% {
      opacity: var(--_rc-button-ripple-opacity, 0);
    }

    to {
      opacity: 0;
      scale: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [part='state-layer'][data-rippling]::after {
      animation-duration: 0ms;
    }

    [part='progress']::before {
      animation-duration: 2s;
    }
  }

  @media (forced-colors: active) {
    ::slotted(:is(button, a[href])) {
      border-color: ButtonBorder;
      background: ButtonFace;
      color: ButtonText;
    }

    [part='state-layer']::before {
      background: Highlight;
    }
  }
`;

export default buttonStyles;
