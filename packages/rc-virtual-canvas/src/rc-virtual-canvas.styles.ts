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
    scrollbar-width: thin;
  }

  #placeholder {
    pointer-events: none;
  }
`;

export default virtualCanvasStyles;
