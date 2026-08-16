import { css } from 'lit';

export const cardStyles = css`
  :host {
    position: relative;
    display: grid;
    grid-template-rows: var(--rc-card-grid-template-rows, auto auto auto 1fr auto auto);
    min-inline-size: 0;
    border: var(--rc-card-border, 0);
    border-radius: var(--rc-card-radius, 0);
    background: var(--rc-card-bg, Canvas);
    color: var(--rc-card-color, CanvasText);
    box-shadow: var(--rc-card-shadow, none);
    overflow: clip;
    box-sizing: border-box;
  }

  :host([hidden]) {
    display: none;
  }

  :host([interactive]:not([disabled])) {
    cursor: pointer;
  }

  [part='container'],
  [part='state-layer'] {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
  }

  [part='container'] {
    background: var(--rc-card-container-bg, transparent);
    z-index: 0;
  }

  [part='state-layer'] {
    background: var(--rc-card-state-layer-bg, currentColor);
    opacity: 0;
    transition: opacity var(--rc-card-state-layer-duration, 150ms)
      var(--rc-card-state-layer-easing, ease);
    z-index: 1;
  }

  :host([interactive]:not([disabled]):hover) [part='state-layer'] {
    opacity: var(--rc-card-hover-state-layer-opacity, 0);
  }

  :host([interactive]:not([disabled]):active) [part='state-layer'] {
    opacity: var(--rc-card-pressed-state-layer-opacity, 0);
  }

  [part='media'],
  [part='header'],
  [part='title'],
  [part='subtitle'],
  [part='body'],
  [part='actions'],
  [part='footer'] {
    position: relative;
    z-index: 2;
    min-inline-size: 0;
    box-sizing: border-box;
  }

  [part='media'] {
    grid-row: var(--rc-card-media-grid-row, auto);
  }

  [part='header'] {
    grid-row: var(--rc-card-header-grid-row, auto);
    padding-block: var(--rc-card-header-padding-block, var(--rc-card-padding-block, 0) 0);
    padding-inline: var(--rc-card-header-padding-inline, var(--rc-card-padding-inline, 0));
  }

  [part='title'] {
    grid-row: var(--rc-card-title-grid-row, auto);
    padding-block: var(--rc-card-title-padding-block, var(--rc-card-padding-block, 0) 0);
    padding-inline: var(--rc-card-title-padding-inline, var(--rc-card-padding-inline, 0));
    color: var(--rc-card-title-color, inherit);
    font: var(--rc-card-title-font, inherit);
  }

  [part='subtitle'] {
    grid-row: var(--rc-card-subtitle-grid-row, auto);
    padding-block: var(--rc-card-subtitle-padding-block, 0);
    padding-inline: var(--rc-card-subtitle-padding-inline, var(--rc-card-padding-inline, 0));
    color: var(--rc-card-subtitle-color, inherit);
    font: var(--rc-card-subtitle-font, inherit);
  }

  [part='body'] {
    grid-row: var(--rc-card-body-grid-row, auto);
    min-block-size: 0;
  }

  [part='actions'] {
    grid-row: var(--rc-card-actions-grid-row, auto);
    display: flex;
    align-items: center;
    justify-content: var(--rc-card-actions-justify, flex-end);
    gap: var(--rc-card-actions-gap, 0);
    padding-block: var(--rc-card-actions-padding-block, 0 var(--rc-card-padding-block, 0));
    padding-inline: var(--rc-card-actions-padding-inline, var(--rc-card-padding-inline, 0));
  }

  [part='footer'] {
    grid-row: var(--rc-card-footer-grid-row, auto);
    padding-block: var(--rc-card-footer-padding-block, 0 var(--rc-card-padding-block, 0));
    padding-inline: var(--rc-card-footer-padding-inline, var(--rc-card-padding-inline, 0));
  }

  :host(:not([has-media])) [part='media'],
  :host(:not([has-header])) [part='header'],
  :host(:not([has-title])) [part='title'],
  :host(:not([has-subtitle])) [part='subtitle'],
  :host(:not([has-actions])) [part='actions'],
  :host(:not([has-footer])) [part='footer'] {
    display: none;
  }

  ::slotted([slot='media']) {
    display: block;
    inline-size: 100%;
  }

  ::slotted(:not([slot])) {
    padding-block: var(--rc-card-body-padding-block, var(--rc-card-padding-block, 1rem));
    padding-inline: var(--rc-card-body-padding-inline, var(--rc-card-padding-inline, 1rem));
  }

  @media (forced-colors: active) {
    :host {
      border-color: CanvasText;
      background: Canvas;
      color: CanvasText;
    }

    [part='state-layer'] {
      background: Highlight;
    }
  }
`;

export default cardStyles;
