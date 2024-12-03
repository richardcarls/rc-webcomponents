import { css } from 'lit';

export const menuButtonStyles = css`
  :host {
    display: inline-block;
    position: relative;
  }

  #root {
    display: inline-block;
  }

  #trigger-wrap {
    display: contents;
  }

  #popup {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: var(--rc-menu-button-popup-z-index, 1000);
    margin-top: 2px;
  }

  #popup[hidden] {
    display: none;
  }
`;

export default menuButtonStyles;
