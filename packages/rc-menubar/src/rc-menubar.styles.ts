import { css } from 'lit';

export const menubarStyles = css`
  :host {
    display: inline-block;
  }

  #root {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: var(--rc-menubar-gap, var(--rc-control-gap, 0.25em));
    padding-inline: var(--rc-menubar-padding-inline, var(--rc-control-padding-inline, 0.25em));
    padding-block: var(--rc-menubar-padding-block, var(--rc-control-padding-block, 0.25em));
    border: var(--rc-menubar-border, var(--rc-border, 1px solid ButtonBorder));
    border-radius: var(--rc-menubar-radius, var(--rc-control-radius, 0));
    background: var(--rc-menubar-background, var(--rc-surface, Canvas));
    color: var(--rc-menubar-color, var(--rc-field-text, CanvasText));
    font-family: var(--rc-font-family, inherit);
    font-size: var(--rc-font-size, inherit);
    line-height: var(--rc-line-height, normal);
  }

  :host([orientation='vertical']) #root {
    flex-direction: column;
    align-items: stretch;
  }

  #slot-wrap {
    display: flex;
    flex-direction: inherit;
    align-items: stretch;
    gap: inherit;
    min-inline-size: 0;
  }

  ::slotted(rc-menu-button) {
    flex: 0 0 auto;
  }

  :host([orientation='vertical']) ::slotted(rc-menu-button) {
    inline-size: 100%;
  }
`;

export default menubarStyles;
