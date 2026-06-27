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
    --rc-menu-button-trigger-block-size: var(--rc-menubar-item-block-size, 2.25em);
    --rc-menu-button-trigger-padding-block: var(--rc-menubar-item-padding-block, 0.25em);
    --rc-menu-button-trigger-padding-inline: var(--rc-menubar-item-padding-inline, 0.75em);
    --rc-menu-button-trigger-gap: var(--rc-menubar-item-gap, var(--rc-item-gap, 0.5em));
    --rc-menu-button-trigger-border: var(--rc-menubar-item-border, 1px solid transparent);
    --rc-menu-button-trigger-radius: var(--rc-menubar-item-radius, var(--rc-control-radius, 0.125em));
    --rc-menu-button-trigger-background: var(--rc-menubar-item-background, transparent);
    --rc-menu-button-trigger-color: var(--rc-menubar-item-color, inherit);
    --rc-menu-button-trigger-transition: var(--rc-menubar-item-transition);
    --rc-menu-button-trigger-hover-border-color: var(--rc-menubar-item-hover-border-color, transparent);
    --rc-menu-button-trigger-hover-background: var(
      --rc-menubar-item-hover-background,
      color-mix(in srgb, Highlight 8%, transparent)
    );
    --rc-menu-button-trigger-hover-color: var(--rc-menubar-item-hover-color, inherit);
    --rc-menu-button-trigger-open-border-color: var(--rc-menubar-item-open-border-color, transparent);
    --rc-menu-button-trigger-open-background: var(
      --rc-menubar-item-open-background,
      color-mix(in srgb, Highlight 12%, transparent)
    );
    --rc-menu-button-trigger-open-color: var(--rc-menubar-item-open-color, inherit);
  }

  ::slotted(rc-menu-button[open]) {
    --rc-menu-button-trigger-background: var(
      --rc-menubar-item-open-background,
      color-mix(in srgb, Highlight 12%, transparent)
    );
    --rc-menu-button-trigger-color: var(--rc-menubar-item-open-color, inherit);
    --rc-menu-button-trigger-hover-background: var(
      --rc-menubar-item-open-background,
      color-mix(in srgb, Highlight 12%, transparent)
    );
    --rc-menu-button-trigger-hover-color: var(--rc-menubar-item-open-color, inherit);
    --rc-menu-button-trigger-hover-border-color: var(--rc-menubar-item-open-border-color, transparent);
  }

  :host([orientation='vertical']) ::slotted(rc-menu-button) {
    inline-size: 100%;
  }
`;

export default menubarStyles;
