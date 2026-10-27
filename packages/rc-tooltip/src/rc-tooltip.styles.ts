import { css } from 'lit';

export const tooltipStyles = css`
  :host {
    display: inline-block;
    color-scheme: inherit;
  }

  [part='root'] {
    display: inline-block;
  }

  @media (forced-colors: active) {
    slot[name='content']::slotted(*) {
      border-color: CanvasText;
      background: CanvasText;
      color: Canvas;
    }
  }
`;

export default tooltipStyles;
