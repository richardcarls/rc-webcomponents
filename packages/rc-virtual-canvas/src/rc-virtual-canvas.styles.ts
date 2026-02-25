import { css } from 'lit';

export const virtualCanvasStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  :host {
    position: relative;
    display: block;
    width: max-content;
    line-height: 0; /* remove extra space under slotted <canvas> element(s) */
  }

  :host([hidden]) {
    display: none;
  }

  #root {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    overflow: auto;
    scrollbar-width: var(--rc-virtual-canvas-scrollbar-width, thin);
  }

  #root::-webkit-scrollbar {
    width: var(--rc-virtual-canvas-scrollbar-size, auto);
    height: var(--rc-virtual-canvas-scrollbar-size, auto);
  }

  #root::-webkit-scrollbar-thumb {
    background: var(--rc-virtual-canvas-scrollbar-thumb-background, ButtonFace);
  }

  #root::-webkit-scrollbar-button {
    background: var(--rc-virtual-canvas-scrollbar-button-background, ButtonFace);
  }

  #root::-webkit-scrollbar-track {
    background: var(--rc-virtual-canvas-scrollbar-track-background, Canvas);
  }

  #placeholder {
    pointer-events: none;
  }

  ::slotted(canvas) {
    image-rendering: var(--rc-virtual-canvas-image-rendering, auto);
  }
`;

export default virtualCanvasStyles;
