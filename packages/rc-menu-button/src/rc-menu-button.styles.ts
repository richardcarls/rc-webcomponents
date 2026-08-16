import { css } from 'lit';

export const menuButtonStyles = css`
  :host {
    display: inline-block;
  }

  :host([orientation='vertical']) {
    display: block;
  }

  #root {
    display: inline-block;
  }

  :host([orientation='vertical']) #root {
    display: block;
  }

  #trigger-wrap {
    position: relative;
    display: inline-block;
  }

  :host([orientation='vertical']) #trigger-wrap {
    display: block;
  }

  slot[name='trigger']::slotted(button),
  slot[name='trigger']::slotted([role='button']) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--rc-menu-button-trigger-gap, var(--rc-item-gap, 0.5em));
    min-block-size: var(--rc-menu-button-trigger-block-size, var(--rc-control-block-size, 2.25em));
    padding: var(--rc-menu-button-trigger-padding-block, var(--rc-control-padding-block, 0.25em))
      var(--rc-menu-button-trigger-padding-inline, var(--rc-control-padding-inline, 0.5em));
    appearance: none;
    box-sizing: border-box;
    border: var(--rc-menu-button-trigger-border, var(--rc-border, 1px solid ButtonBorder));
    border-radius: var(--rc-menu-button-trigger-radius, var(--rc-control-radius, 0.125em));
    background: var(--rc-menu-button-trigger-background, var(--rc-button-bg, ButtonFace));
    color: var(--rc-menu-button-trigger-color, var(--rc-button-text, ButtonText));
    font: inherit;
    text-decoration: none;
    cursor: default;
    user-select: none;
    transition: var(--rc-menu-button-trigger-transition);
  }

  slot[name='trigger']::slotted(button:hover),
  slot[name='trigger']::slotted([role='button']:hover) {
    border-color: var(--rc-menu-button-trigger-hover-border-color, currentColor);
    background: var(
      --rc-menu-button-trigger-hover-background,
      color-mix(in srgb, Highlight 8%, transparent)
    );
    color: var(--rc-menu-button-trigger-hover-color, inherit);
  }

  slot[name='trigger']::slotted(button[aria-expanded='true']),
  slot[name='trigger']::slotted([role='button'][aria-expanded='true']) {
    border-color: var(--rc-menu-button-trigger-open-border-color, currentColor);
    background: var(
      --rc-menu-button-trigger-open-background,
      color-mix(in srgb, Highlight 12%, transparent)
    );
    color: var(--rc-menu-button-trigger-open-color, inherit);
  }

  :host([orientation='vertical']) slot[name='trigger']::slotted(button),
  :host([orientation='vertical']) slot[name='trigger']::slotted([role='button']) {
    inline-size: 100%;
    text-align: start;
  }

  :host([has-indicator]) slot[name='trigger']::slotted(button),
  :host([has-indicator]) slot[name='trigger']::slotted([role='button']) {
    padding-inline-end: calc(
      var(
          --rc-menu-button-indicator-inset,
          var(--rc-menu-button-trigger-padding-inline, var(--rc-control-padding-inline, 0.5em))
        ) +
        var(--rc-menu-button-indicator-size, 1em) +
        var(--rc-menu-button-trigger-gap, var(--rc-item-gap, 0.5em))
    );
  }

  slot[name='indicator'] {
    position: absolute;
    inset-block-start: 50%;
    inset-inline-end: var(
      --rc-menu-button-indicator-inset,
      var(--rc-menu-button-trigger-padding-inline, var(--rc-control-padding-inline, 0.5em))
    );
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--rc-menu-button-indicator-size, 1em);
    block-size: var(--rc-menu-button-indicator-size, 1em);
    color: var(--rc-menu-button-indicator-color, currentColor);
    pointer-events: none;
    transform: translateY(-50%);
  }

  slot[name='indicator']::slotted(*) {
    inline-size: 100%;
    block-size: 100%;
  }

  #popup {
    z-index: var(--rc-menu-button-popup-z-index, 1000);
  }

  #popup[hidden] {
    display: none;
  }
`;

export default menuButtonStyles;
