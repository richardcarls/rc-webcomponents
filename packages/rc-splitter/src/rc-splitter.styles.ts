import { css } from "lit";

export const splitterStyles = css`
  :host {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: stretch;
  }

  :host([orientation="vertical"]) {
    flex-direction: column;
  }

  /* because :has(:focus-visible) doens't work across slot boundary */
  :host([data-interaction-mode="keyboard"]):focus-within {
    outline: auto;
  }

  ::slotted(*) {
    width: 100%;
    height: 100%;
  }

  #separator {
    flex: 0 0 6px;
    background-color: lightgray;
    border-left: 1px solid white;
    border-right: 1px solid black;
    cursor: col-resize;

    :host([orientation="vertical"]) & {
      border-left: unset;
      border-right: unset;
      border-top: 1px solid white;
      border-bottom: 1px solid black;
      cursor: row-resize;
    }
  }

  #primary,
  #secondary {
    box-sizing: border-box;
    overflow: hidden;
  }

  #primary {
    flex: 0 1 auto;
  }

  #secondary {
    flex: 1;
  }
`;

export default splitterStyles;
