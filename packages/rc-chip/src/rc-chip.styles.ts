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
    gap: var(--rc-chip-gap, 0.5rem);
    min-block-size: var(--rc-chip-block-size, 2rem);
    padding-block: var(--rc-chip-padding-block, 0);
    padding-inline: var(--rc-chip-padding-inline, 0.75rem);
    border: var(--rc-chip-border, 1px solid ButtonBorder);
    border-radius: var(--rc-chip-radius, 0.5rem);
    background: var(--rc-chip-bg, ButtonFace);
    color: var(--rc-chip-color, ButtonText);
    font: inherit;
    text-decoration: none;
    white-space: nowrap;
  }

  ::slotted(button),
  ::slotted(a) {
    cursor: pointer;
  }

  ::slotted([data-rc-chip-label]) {
    cursor: default;
  }

  :host([selected]) ::slotted(button),
  :host([selected]) ::slotted(a),
  :host([selected]) ::slotted([data-rc-chip-label]) {
    border-color: var(--rc-chip-selected-border-color, transparent);
    background: var(--rc-chip-selected-bg, Highlight);
    color: var(--rc-chip-selected-color, HighlightText);
  }

  :host([disabled]) ::slotted(button) {
    opacity: var(--rc-chip-disabled-opacity, 0.5);
    cursor: not-allowed;
  }

  :host(:focus-within) ::slotted(button),
  :host(:focus-within) ::slotted(a) {
    outline: var(--rc-chip-focus-ring, 2px solid Highlight);
    outline-offset: var(--rc-chip-focus-ring-offset, 2px);
  }

  [part='state-layer'] {
    pointer-events: none;
    position: absolute;
    inset: 0;
    border-radius: var(--rc-chip-radius, 0.5rem);
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

  :host([removable]) ::slotted(button),
  :host([removable]) ::slotted(a),
  :host([removable]) ::slotted([data-rc-chip-label]) {
    padding-inline-end: var(--rc-chip-removable-padding-inline-end, 2rem);
  }

  @media (forced-colors: active) {
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
