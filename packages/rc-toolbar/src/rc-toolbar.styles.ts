import { css } from 'lit';

export const toolbarStyles = css`
  :host {
    display: inline-block;
  }

  #root {
    display: flex;
    flex-direction: row;
    gap: var(--rc-toolbar-gap-inline, var(--rc-control-gap, 0.25em));
    padding-inline: var(--rc-toolbar-padding-inline, calc(var(--rc-control-padding-inline, 0.5em) / 2));
    padding-block: var(--rc-toolbar-padding-block, calc(var(--rc-control-padding-block, 0.25em) / 2));
    border-radius: var(--rc-toolbar-radius, var(--rc-control-radius, 0));
    font-family: var(--rc-font-family, inherit);
    font-size: var(--rc-font-size, inherit);
    line-height: var(--rc-line-height, normal);

    &[aria-orientation='vertical'] {
      flex-direction: column;
    }

    /* because :has(:focus-visible) doens't work across slot boundary */
    &[data-interaction-mode='keyboard']:focus-within {
      outline: var(--rc-focus-ring, auto);
      outline-offset: var(--rc-focus-ring-offset, 0);
    }
  }

  #slot-wrap {
    display: contents;
  }
`;

export default toolbarStyles;
