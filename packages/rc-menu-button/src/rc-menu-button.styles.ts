import { css } from 'lit';

export const menuButtonStyles = css`
  :host {
    display: inline-block;
  }

  #root {
    display: inline-block;
  }

  #trigger-wrap {
    display: contents;
  }

  #popup {
    z-index: var(--rc-menu-button-popup-z-index, 1000);
  }

  #popup[hidden] {
    display: none;
  }
`;

export default menuButtonStyles;
