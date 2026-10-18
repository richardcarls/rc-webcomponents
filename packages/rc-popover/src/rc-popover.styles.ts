import { css } from 'lit';

export const popoverStyles = css`
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
      background: Canvas;
      color: CanvasText;
    }
  }
`;

export default popoverStyles;
