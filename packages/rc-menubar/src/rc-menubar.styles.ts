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
    border-radius: var(--rc-menubar-radius, var(--rc-control-radius, 0));
    font-family: var(--rc-font-family, inherit);
    font-size: var(--rc-font-size, inherit);
    line-height: var(--rc-line-height, normal);
  }

  :host([orientation='vertical']) #root {
    flex-direction: column;
  }

  #slot-wrap {
    display: contents;
  }
`;

export default menubarStyles;
