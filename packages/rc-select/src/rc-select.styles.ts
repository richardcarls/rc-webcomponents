import { css } from 'lit';

export const selectStyles = css`
  :host {
    display: inline-block;
  }

  #anchor {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25em;
  }

  #trigger {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25em;
    padding: 0.25em 0.5em;
    min-width: 8em;
    cursor: default;
    user-select: none;
    border: 1px solid ButtonBorder;
    border-radius: 0.125em;
    background: Field;
    color: FieldText;

    /* Keyboard focus indicator */
    outline: none;
    &:focus-visible {
      outline: auto;
    }
  }

  [part='value-display'] {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  [part='toggle-icon'] {
    flex-shrink: 0;
    font-size: 0.75em;
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

  /* Hidden native select slot */
  slot[name='select'] {
    display: none;
  }

  /* Listbox (rc-listbox element inside shadow DOM) */
  rc-listbox {
    /* JS anchor positioning applies top/left. Shadow root styles provide the rest. */
    position: fixed;
    top: anchor(bottom);
    left: anchor(left);
    min-width: anchor-size(width);
    margin-top: 2px;

    /* Scrollable container */
    max-height: var(--rc-select-max-height, 20em);
    overflow-y: auto;

    /* Visual style (UA colors only) */
    background: Canvas;
    border: 1px solid ButtonBorder;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    color: ButtonText;
    padding-block: 0.25em;

    /* When not open */
    &:not(:popover-open) {
      display: none;
    }
  }

  /* Options within the listbox (via part targeting) */
  ::slotted([part~='option']),
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

export default selectStyles;
