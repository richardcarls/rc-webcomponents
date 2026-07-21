import { css } from 'lit';

export const chipSetStyles = css`
  :host {
    display: inline-block;
    color-scheme: inherit;
  }

  :host([hidden]) {
    display: none;
  }

  [part='root'] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--rc-chip-set-gap, 0.5rem);
  }

  :host([orientation='vertical']) [part='root'] {
    flex-direction: column;
    align-items: stretch;
  }
`;

export default chipSetStyles;
