import { css } from 'lit';

export const toolbarStyles = css`
  :host {
    display: inline-block;
  }

  #root {
    display: flex;
    flex-direction: row;
    gap: var(--rc-toolbar-gap-inline, 0.25em);
    padding-inline: var(--rc-toolbar-padding-inline, 0.25em);
    padding-block: var(--rc-toolbar-padding-block, 0.125em);

    &[aria-orientation='vertical'] {
      flex-direction: column;
    }

    /* because :has(:focus-visible) doens't work across slot boundary */
    &[data-interaction-mode='keyboard']:focus-within {
      outline: auto;
    }
  }

  #slot-wrap {
    display: contents;
  }
`;

export default toolbarStyles;
