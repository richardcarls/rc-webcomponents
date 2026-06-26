import { css } from 'lit';

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
    gap: var(--rc-transfer-list-gap, var(--rc-control-gap, 0.75rem));
  }

  :host([compact]) #root {
    grid-template-columns: minmax(0, 1fr);
  }

  .rc-transfer-list-panel {
    display: flex;
    min-inline-size: 0;
    flex-direction: column;
    gap: var(--rc-transfer-list-panel-gap, var(--rc-control-gap, 0.35rem));
  }

  .rc-transfer-list-panel > rc-listbox {
    flex: 1 1 auto;
    min-block-size: var(--rc-transfer-list-listbox-min-block-size, 10rem);
    overflow: auto;
    border: var(--rc-transfer-list-listbox-border, var(--rc-border, 1px solid ButtonBorder));
    background: var(--rc-transfer-list-listbox-bg, var(--rc-surface, Canvas));
    color: var(--rc-transfer-list-listbox-color, var(--rc-field-text, FieldText));
    --rc-listbox-option-gap: var(--rc-transfer-list-option-gap, var(--rc-item-gap, 0.4em));
    --rc-listbox-option-padding-block: var(
      --rc-transfer-list-option-padding-block,
      var(--rc-item-padding-block, 0.3em)
    );
    --rc-listbox-option-padding-inline: var(
      --rc-transfer-list-option-padding-inline,
      var(--rc-item-padding-inline, 0.75em)
    );
    --rc-listbox-hover-bg: var(
      --rc-transfer-list-option-hover-bg,
      var(--rc-transfer-list-option-selected-bg, var(--rc-highlight, Highlight))
    );
    --rc-listbox-hover-color: var(
      --rc-transfer-list-option-hover-color,
      var(--rc-transfer-list-option-selected-color, var(--rc-highlight-text, HighlightText))
    );
    --rc-listbox-active-bg: var(
      --rc-transfer-list-option-hover-bg,
      var(--rc-transfer-list-option-selected-bg, var(--rc-highlight, Highlight))
    );
    --rc-listbox-active-color: var(
      --rc-transfer-list-option-hover-color,
      var(--rc-transfer-list-option-selected-color, var(--rc-highlight-text, HighlightText))
    );
    --rc-listbox-selected-bg: var(
      --rc-transfer-list-option-selected-bg,
      var(--rc-highlight, Highlight)
    );
    --rc-listbox-selected-color: var(
      --rc-transfer-list-option-selected-color,
      var(--rc-highlight-text, HighlightText)
    );
    --rc-listbox-disabled-opacity: var(--rc-disabled-opacity, 0.5);
  }

  rc-listbox [part~='option'][hidden] {
    display: none;
  }

  rc-listbox [part~='option'][data-active]:not([aria-disabled='true']) {
    outline: var(--rc-focus-ring, 2px solid var(--rc-accent, Highlight));
    outline-offset: -2px;
  }

  rc-listbox [part~='option'][aria-disabled='true'] {
    cursor: not-allowed;
  }

  #actions {
    align-self: center;
    transform: translateY(
      calc((1lh + var(--rc-transfer-list-panel-gap, var(--rc-control-gap, 0.35rem))) / 2)
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

  slot:not([name]) {
    display: none;
  }
`;

export default transferListStyles;
