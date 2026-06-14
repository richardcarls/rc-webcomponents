import { css } from 'lit';

export const splitterStyles = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  :host {
    --rc-splitter-separator-size: 6px;

    position: relative;
    display: flex;
    flex-direction: row;
    align-items: stretch;
  }

  :host([orientation='vertical']) {
    flex-direction: column;
  }

  :host([hidden]) {
    display: none;
  }

  /* because :has(:focus-visible) doens't work across slot boundary */
  :host([data-interaction-mode='keyboard']):focus-within {
    outline: auto;
  }

  ::slotted(*) {
    width: 100%;
    height: 100%;
  }

  #separator {
    grid-column: separator;
    flex: 0 0 var(--rc-splitter-separator-size, 6px);
    display: flex;
    flex-direction: column;
    justify-content: center;
    background-color: var(--rc-splitter-separator-color, color-mix(in srgb, ButtonBorder 35%, Canvas 65%));
    border-left: var(--rc-splitter-separator-border-inline-start, var(--rc-splitter-keyline, 1px solid ButtonBorder));
    border-right: var(--rc-splitter-separator-border-inline-end, var(--rc-splitter-keyline, 1px solid ButtonBorder));

    :host([orientation='vertical']) & {
      flex-direction: row;
      border-left: unset;
      border-right: unset;
      border-top: var(--rc-splitter-separator-border-block-start, var(--rc-splitter-keyline, 1px solid ButtonBorder));
      border-bottom: var(--rc-splitter-separator-border-block-end, var(--rc-splitter-keyline, 1px solid ButtonBorder));
    }
  }

  #separator-handle {
    width: 100%;
    height: var(--rc-splitter-separator-handle-size, 100%);
    background:
      linear-gradient(
        to bottom,
        transparent,
        transparent calc(50% - 1px),
        var(--rc-splitter-handle-color, ButtonBorder) calc(50% - 1px),
        var(--rc-splitter-handle-color, ButtonBorder) calc(50% + 1px),
        transparent calc(50% + 1px),
        transparent
      );
    cursor: col-resize;

    :host([orientation='vertical']) & {
      width: var(--rc-splitter-separator-handle-size, 100%);
      height: 100%;
      background:
        linear-gradient(
          to right,
          transparent,
          transparent calc(50% - 1px),
          var(--rc-splitter-handle-color, ButtonBorder) calc(50% - 1px),
          var(--rc-splitter-handle-color, ButtonBorder) calc(50% + 1px),
          transparent calc(50% + 1px),
          transparent
        );
      cursor: row-resize;
    }

    :host([fixed]) {
      pointer-events: none;
    }
  }

  #primary,
  #secondary {
    overflow: hidden;
  }

  #primary {
    grid-column: primary;
    flex: 0 0 auto;
  }

  #secondary {
    grid-column: secondary;
    flex: 1;
  }
`;

export default splitterStyles;
