import { css } from 'lit';

export const chipStyles = css`
  :host {
    display: inline-grid;
    position: relative;
    color-scheme: inherit;
    vertical-align: middle;
  }

  :host([hidden]) {
    display: none;
  }

  ::slotted(button),
  ::slotted(a),
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
  :host([selected]) ::slotted([data-rc-chip-label]) {
    border-color: var(--rc-chip-selected-border-color, revert);
    background: var(--rc-chip-selected-bg, revert);
    color: var(--rc-chip-selected-color, revert);
  }

  :host([disabled]) ::slotted(button) {
    opacity: var(--rc-chip-disabled-opacity, revert);
  }

  :host(:focus-within) ::slotted(button),
  :host(:focus-within) ::slotted(a) {
    outline: var(--rc-chip-focus-ring, revert);
    outline-offset: var(--rc-chip-focus-ring-offset, revert);
  }

  [part='state-layer'] {
    pointer-events: none;
    position: absolute;
    inset: 0;
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
    pointer-events: none;
    inset-block: 0;
    inset-inline-end: var(--rc-chip-remove-offset-inline, 0.125rem);
    display: none;
    place-items: center;
    min-inline-size: var(--rc-chip-remove-target-size, 1.5rem);
    min-block-size: var(--rc-chip-remove-target-size, 1.5rem);
    margin: auto 0;
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
  :host([removable]) ::slotted([data-rc-chip-label]) {
    padding-inline-end: var(
      --rc-chip-removable-padding-inline-end,
      calc(var(--rc-chip-remove-target-size, 1.5rem) - var(--rc-chip-gap, 0px))
    );
  }

  @media (forced-colors: active) {
    [part='state-layer'] {
      display: none;
    }

    ::slotted(button),
    ::slotted(a),
    ::slotted([data-rc-chip-label]) {
      border-color: ButtonBorder;
      background: ButtonFace;
      color: ButtonText;
    }

    :host([selected]) ::slotted(button),
    :host([selected]) ::slotted(a),
    :host([selected]) ::slotted([data-rc-chip-label]) {
      border-color: Highlight;
      background: Highlight;
      color: HighlightText;
    }
  }
`;

export default chipStyles;
