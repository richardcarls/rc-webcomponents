import { css } from 'lit';

export const menubarStyles = css`
  :host {
    display: block;
  }

  #root {
    display: flex;
    flex-direction: row;
    gap: var(--rc-menubar-gap, 0);
    padding-inline: var(--rc-menubar-padding-inline, 0);
    padding-block: var(--rc-menubar-padding-block, 0);
  }

  :host([orientation='vertical']) #root {
    flex-direction: column;
  }

  #slot-wrap {
    display: contents;
  }
`;

export default menubarStyles;
