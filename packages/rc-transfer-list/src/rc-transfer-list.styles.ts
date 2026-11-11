import { css } from 'lit';

import { rcToken } from '@rcarls/rc-common';

export const transferListStyles = css`
  :host {
    display: block;
  }

  :host([hidden]) {
    display: none;
  }

  #root {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: stretch;
    gap: var(--rc-transfer-list-gap, ${rcToken('--rc-control-gap')});
  }

  :host([compact]) #root {
    grid-template-columns: minmax(0, 1fr);
  }

  .rc-transfer-list-panel {
    display: flex;
    min-inline-size: 0;
    flex-direction: column;
    gap: var(--rc-transfer-list-panel-gap, ${rcToken('--rc-control-gap')});
  }

  .rc-transfer-list-panel > rc-listbox {
    flex: 1 1 auto;
    min-block-size: var(--rc-transfer-list-listbox-min-block-size, 10rem);
    overflow: auto;
    border: var(--rc-transfer-list-listbox-border, ${rcToken('--rc-border')});
    border-radius: var(--rc-transfer-list-listbox-radius, ${rcToken('--rc-control-radius')});
    background: var(--rc-transfer-list-listbox-bg, ${rcToken('--rc-surface')});
    color: var(--rc-transfer-list-listbox-color, ${rcToken('--rc-field-text')});
    --rc-listbox-option-gap: var(--rc-transfer-list-option-gap, ${rcToken('--rc-item-gap')});
    --rc-listbox-option-padding-block: var(
      --rc-transfer-list-option-padding-block,
      ${rcToken('--rc-item-padding-block')}
    );
    --rc-listbox-option-padding-inline: var(
      --rc-transfer-list-option-padding-inline,
      ${rcToken('--rc-item-padding-inline')}
    );
    --rc-listbox-hover-bg: var(
      --rc-transfer-list-option-hover-bg,
      var(--rc-transfer-list-option-selected-bg, ${rcToken('--rc-highlight')})
    );
    --rc-listbox-hover-color: var(
      --rc-transfer-list-option-hover-color,
      var(--rc-transfer-list-option-selected-color, ${rcToken('--rc-highlight-text')})
    );
    --rc-listbox-active-bg: var(
      --rc-transfer-list-option-hover-bg,
      var(--rc-transfer-list-option-selected-bg, ${rcToken('--rc-highlight')})
    );
    --rc-listbox-active-color: var(
      --rc-transfer-list-option-hover-color,
      var(--rc-transfer-list-option-selected-color, ${rcToken('--rc-highlight-text')})
    );
    --rc-listbox-selected-bg: var(
      --rc-transfer-list-option-selected-bg,
      ${rcToken('--rc-highlight')}
    );
    --rc-listbox-selected-color: var(
      --rc-transfer-list-option-selected-color,
      ${rcToken('--rc-highlight-text')}
    );
    --rc-listbox-disabled-opacity: ${rcToken('--rc-disabled-opacity')};
  }

  rc-listbox [part~='option'][hidden] {
    display: none;
  }

  rc-listbox [part~='option'][data-rc-active]:not([aria-disabled='true']) {
    outline: ${rcToken('--rc-focus-ring')};
    outline-offset: -2px;
  }

  rc-listbox [part~='option'][aria-disabled='true'] {
    cursor: not-allowed;
  }

  #actions {
    align-self: center;
    transform: translateY(
      calc((1lh + var(--rc-transfer-list-panel-gap, ${rcToken('--rc-control-gap')})) / 2)
    );
  }

  :host([compact]) #actions {
    align-self: stretch;
    transform: none;
  }

  :host([compact]) #actions::part(root) {
    flex-wrap: wrap;
    justify-content: center;
  }

  #actions button {
    white-space: nowrap;
  }

  /* The arrows point along the inline axis, so they turn over in RTL. */
  .arrow:dir(rtl) {
    display: inline-block;
    transform: scaleX(-1);
  }

  slot:not([name]) {
    display: none;
  }
`;

export default transferListStyles;
