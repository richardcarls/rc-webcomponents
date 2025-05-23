import { css } from 'lit';

export const comboboxStyles = css`
  :host {
    display: inline-block;
  }

  #anchor {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25em;
    border: 1px solid ButtonBorder;
    border-radius: 0.125em;
    background: Field;
    color: FieldText;
    padding: 0.125em 0.25em;
    cursor: text;
  }

  /* Chips */
  [part='chip'] {
    display: inline-flex;
    align-items: center;
    gap: 0.2em;
    padding: 0.1em 0.3em;
    border: 1px solid ButtonBorder;
    border-radius: 0.25em;
    background: ButtonFace;
    color: ButtonText;
    font: inherit;
    font-size: 0.875em;
  }

  [part='chip-remove'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    width: 1em;
    height: 1em;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font: inherit;

    &:hover {
      background: ButtonBorder;
    }

    &:focus-visible {
      outline: auto;
    }
  }

  #trigger {
    flex: 1;
    min-width: 6em;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    outline: none;
    padding: 0.25em 0.25em;
    cursor: text;
  }

  #trigger::placeholder {
    color: GrayText;
  }

  #toggle {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.25em;
    border: none;
    background: transparent;
    color: inherit;
    cursor: default;
    font-size: 0.75em;
    font: inherit;

    &:focus-visible {
      outline: auto;
    }
  }

  /* Hidden native select slot */
  slot[name='select'] {
    display: none;
  }

  /* Listbox popup */
  rc-listbox {
    position: fixed;
    top: anchor(bottom);
    left: anchor(left);
    min-width: anchor-size(width);
    margin-top: 2px;

    max-height: var(--rc-combobox-max-height, 20em);
    overflow-y: auto;

    background: Canvas;
    border: 1px solid ButtonBorder;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    color: ButtonText;
    padding-block: 0.25em;

    &:not(:popover-open) {
      display: none;
    }
  }

  rc-listbox [part~='option'] {
    display: block;
    padding: 0.3em 0.75em;
    cursor: default;

    &:not([hidden]):not([aria-disabled='true']):hover {
      background: Highlight;
      color: HighlightText;
    }

    &[aria-selected='true'] {
      font-weight: bold;
    }

    &[aria-disabled='true'] {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  rc-listbox [part~='create-option'] {
    font-style: italic;
    border-top: 1px solid ButtonBorder;
    margin-top: 0.25em;
    padding-top: 0.3em;
  }
`;

export default comboboxStyles;
