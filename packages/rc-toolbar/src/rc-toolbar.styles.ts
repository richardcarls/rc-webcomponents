import { css } from 'lit';

import { rcToken } from '@rcarls/rc-common';

export const toolbarStyles = css`
  :host {
    display: inline-block;
  }

  #root {
    display: flex;
    flex-direction: row;
    flex-wrap: var(--rc-toolbar-flex-wrap, nowrap);
    gap: var(--rc-toolbar-gap-inline, ${rcToken('--rc-control-gap')});
    padding-inline: var(
      --rc-toolbar-padding-inline,
      calc(${rcToken('--rc-control-padding-inline')} / 2)
    );
    padding-block: var(
      --rc-toolbar-padding-block,
      calc(${rcToken('--rc-control-padding-block')} / 2)
    );
    border-radius: var(--rc-toolbar-radius, ${rcToken('--rc-control-radius')});
    font-family: ${rcToken('--rc-font-family', 'inherit')};
    font-size: ${rcToken('--rc-font-size', 'inherit')};
    line-height: ${rcToken('--rc-line-height')};

    /*
     * Layout keys off the author's orientation, not aria-orientation: the
     * exposed value reports the rendered orientation, which turns over in
     * vertical writing modes while the layout axis does not.
     */
    :host([orientation='vertical']) & {
      flex-direction: column;
      border-radius: var(
        --rc-toolbar-vertical-radius,
        var(--rc-toolbar-radius, ${rcToken('--rc-control-radius')})
      );
    }
  }

  #slot-wrap {
    display: contents;
  }
`;

export default toolbarStyles;
