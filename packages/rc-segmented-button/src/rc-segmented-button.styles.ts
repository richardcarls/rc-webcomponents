import { css } from 'lit';

export const segmentedButtonStyles = css`
  :host {
    display: inline-block;
    color-scheme: inherit;
  }

  :host([hidden]) {
    display: none;
  }
`;

export default segmentedButtonStyles;
