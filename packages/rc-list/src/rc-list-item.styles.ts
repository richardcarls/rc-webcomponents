import { css } from 'lit';

export const listItemStyles = css`
  :host {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    min-inline-size: 0;
    color: var(--rc-list-item-color, CanvasText);
    color-scheme: inherit;
  }

  :host([hidden]) {
    display: none;
  }

  [part='row'] {
    position: relative;
    display: grid;
    box-sizing: border-box;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    align-items: center;
    min-block-size: var(--rc-list-item-min-block-size, 3rem);
    min-inline-size: 0;
    padding-block: var(--rc-list-item-padding-block, 0.5rem);
    overflow: clip;
    border: var(--rc-list-item-border, 0);
    border-radius: var(--rc-list-item-border-radius, 0);
    background: var(--rc-list-item-background, transparent);
    box-shadow: var(--rc-list-item-box-shadow, none);
    transition:
      background-color var(--rc-list-item-transition-duration, 0ms)
        var(--rc-list-item-transition-easing, ease),
      box-shadow var(--rc-list-item-transition-duration, 0ms)
        var(--rc-list-item-transition-easing, ease);
  }

  [part='state-layer'] {
    position: absolute;
    z-index: 0;
    inset: 0;
    pointer-events: none;
    background: var(--rc-list-item-state-layer-color, currentColor);
    opacity: var(--rc-list-item-state-layer-opacity, 0);
    transition: opacity var(--rc-list-item-transition-duration, 0ms)
      var(--rc-list-item-transition-easing, ease);
  }

  [part='leading'],
  [part='content'],
  [part='trailing'] {
    position: relative;
    z-index: 1;
    min-inline-size: 0;
  }

  [part='leading'] {
    grid-column: leading-start / leading-end;
  }

  [part='content'] {
    grid-column: content-start / content-end;
    overflow: hidden;
    text-overflow: var(--rc-list-item-content-text-overflow, ellipsis);
    white-space: var(--rc-list-item-content-white-space, nowrap);
  }

  [part='trailing'] {
    grid-column: trailing-start / trailing-end;
    justify-self: end;
  }

  [part='leading'][hidden],
  [part='trailing'][hidden] {
    display: none;
  }

  ::slotted(*) {
    min-inline-size: 0;
  }

  [part='content'] ::slotted(*) {
    overflow: hidden;
    text-overflow: inherit;
  }

  [part='divider'] {
    position: absolute;
    z-index: 1;
    inset-block-end: 0;
    inset-inline: var(--rc-list-item-divider-inset-inline, 0);
    border-block-end: var(--rc-list-item-divider, 0);
    pointer-events: none;
  }

  :host([interactive]:not([disabled])) {
    cursor: pointer;
  }

  :host([interactive]:not([disabled]):hover) [part='state-layer'] {
    opacity: var(--rc-list-item-hover-state-layer-opacity, 0.08);
  }

  :host([interactive]:not([disabled]):focus-within) [part='state-layer'] {
    opacity: var(--rc-list-item-focus-state-layer-opacity, 0.1);
  }

  :host([interactive]:not([disabled]):active) [part='state-layer'] {
    opacity: var(--rc-list-item-pressed-state-layer-opacity, 0.1);
  }

  :host([selected]) [part='row'] {
    color: var(--rc-list-item-selected-color, var(--rc-list-item-color, CanvasText));
    background: var(--rc-list-item-selected-background, transparent);
  }

  :host([disabled]) {
    cursor: default;
    opacity: var(--rc-list-item-disabled-opacity, 0.38);
  }

  @media (forced-colors: active) {
    [part='row'] {
      border-color: CanvasText;
    }

    :host([selected]) [part='row'] {
      outline: 2px solid Highlight;
      outline-offset: -2px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    [part='row'],
    [part='state-layer'] {
      transition-duration: 0ms;
    }
  }
`;

export default listItemStyles;
