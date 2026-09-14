import { css } from 'lit';

export const chipStyles = css`
  :host {
    display: inline-grid;
    position: relative;
    place-items: center;
    min-block-size: var(--rc-chip-touch-target-block-size, 3rem);
    color-scheme: inherit;
    vertical-align: middle;
    /*
     * Zero by default. Unlike rc-button's touch-target inflation (opt-in via
     * icon-only), a chip's accessible touch-target minimum applies
     * unconditionally, so it's a common fit inside a height-constrained
     * field -- rc-search-bar's or rc-combobox's multi-select value area, say
     * -- where 3rem per chip would force the field taller than its own
     * content needs. A theme or consumer sets one of these on a chip that
     * sits at a real block-axis edge (no neighbor on that side within the
     * field) to let the touch target overlap into the field's own block
     * padding instead of also reserving layout space there. The same
     * pattern as rc-button's, rc-menu-button's, and rc-adaptive-menu's own
     * touch-target overlap tokens, but on the block axis: a chip's own
     * touch-target inflation is vertical, not horizontal.
     */
    margin-block-start: calc(-1 * var(--rc-chip-touch-target-overlap-block-start, 0px));
    margin-block-end: calc(-1 * var(--rc-chip-touch-target-overlap-block-end, 0px));
  }

  :host([readonly]) {
    min-block-size: var(--rc-chip-block-size, auto);
  }

  :host([hidden]) {
    display: none;
  }

  ::slotted(button),
  ::slotted(a),
  ::slotted(label),
  ::slotted([data-rc-chip-label]) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--rc-chip-gap, 0px);
    min-block-size: var(--rc-chip-block-size);
    padding-block: var(--rc-chip-padding-block, revert);
    padding-inline: var(--rc-chip-padding-inline, revert);
    border: var(--rc-chip-border, revert);
    border-radius: var(--rc-chip-radius, revert);
    background: var(--rc-chip-bg, revert);
    color: var(--rc-chip-color, revert);
    font: var(--rc-chip-font, revert);
    text-decoration: var(--rc-chip-text-decoration, revert);
    white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
  }

  :host([selected]) ::slotted(button),
  :host([selected]) ::slotted(a),
  :host([selected]) ::slotted(label),
  :host([selected]) ::slotted([data-rc-chip-label]) {
    border-color: var(--rc-chip-selected-border-color, revert);
    background: var(--rc-chip-selected-bg, revert);
    color: var(--rc-chip-selected-color, revert);
  }

  :host([disabled]) ::slotted(button) {
    opacity: var(--rc-chip-disabled-opacity, revert);
  }

  :host(:focus-within) ::slotted(button),
  :host(:focus-within) ::slotted(a),
  :host(:focus-within) ::slotted(label) {
    outline: var(--rc-chip-focus-ring, revert);
    outline-offset: var(--rc-chip-focus-ring-offset, revert);
  }

  [part='state-layer'] {
    pointer-events: none;
    position: absolute;
    z-index: 2;
    inset-inline: 0;
    inset-block-start: 50%;
    block-size: var(--rc-chip-block-size, 100%);
    translate: 0 -50%;
    border-radius: var(--rc-chip-radius, 0);
    background: var(--rc-chip-state-layer-color, currentColor);
    opacity: 0;
    transition: opacity
      var(--rc-chip-state-layer-transition-duration, var(--rc-motion-effects-duration-fast, 80ms))
      var(--rc-chip-state-layer-transition-easing, var(--rc-motion-effects-easing-fast, ease-out));
  }

  :host([selected]) [part='state-layer'] {
    background: var(
      --rc-chip-selected-state-layer-color,
      var(--rc-chip-state-layer-color, currentColor)
    );
  }

  @media (hover: hover) {
    :host(:not([disabled], [readonly]):hover) [part='state-layer'] {
      opacity: var(--rc-chip-hover-state-layer-opacity, 0.08);
    }
  }

  :host(:not([disabled], [readonly]):focus-within) [part='state-layer'] {
    opacity: var(--rc-chip-focus-state-layer-opacity, 0.12);
  }

  :host(:not([disabled], [readonly]):active) [part='state-layer'] {
    opacity: var(--rc-chip-pressed-state-layer-opacity, 0.12);
  }

  [part='remove'] {
    position: absolute;
    z-index: 3;
    pointer-events: none;
    inset-block-start: 50%;
    inset-inline-end: var(--rc-chip-remove-offset-inline, 0.125rem);
    display: none;
    place-items: center;
    min-inline-size: var(--rc-chip-remove-target-size, 1.5rem);
    min-block-size: var(--rc-chip-remove-target-size, 1.5rem);
    translate: 0 -50%;
    border: 0;
    border-radius: var(--rc-chip-remove-radius, 9999px);
    background: transparent;
    color: inherit;
    font: inherit;
  }

  :host([removable]) [part='remove'] {
    display: inline-grid;
  }

  ::slotted([slot='remove-icon']) {
    /* Keep icon-font utility classes from overriding the chip's compact icon size. */
    font-size: var(--rc-chip-remove-icon-size, smaller) !important;
  }

  :host([removable]) ::slotted(button),
  :host([removable]) ::slotted(a),
  :host([removable]) ::slotted(label),
  :host([removable]) ::slotted([data-rc-chip-label]) {
    padding-inline-end: var(
      --rc-chip-removable-padding-inline-end,
      calc(
        var(--rc-chip-remove-target-size, 1.5rem) +
          var(--rc-chip-remove-offset-inline, 0.125rem)
      )
    );
  }

  @media (forced-colors: active) {
    [part='state-layer'] {
      display: none;
    }

    ::slotted(button),
    ::slotted(a),
    ::slotted(label),
    ::slotted([data-rc-chip-label]) {
      border-color: ButtonBorder;
      background: ButtonFace;
      color: ButtonText;
    }

    :host([selected]) ::slotted(button),
    :host([selected]) ::slotted(a),
    :host([selected]) ::slotted(label),
    :host([selected]) ::slotted([data-rc-chip-label]) {
      border-color: Highlight;
      background: Highlight;
      color: HighlightText;
    }
  }
`;

export default chipStyles;
