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
    border: 1px solid var(--rc-border-color, ButtonBorder);
    border-radius: var(--rc-radius-sm, 0.125em);
    background: var(--rc-field, Field);
    color: var(--rc-field-text, FieldText);

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

  /* Chips — the whole chip is the remove button for a larger touch target */
  [part='chip'] {
    display: inline-flex;
    align-items: center;
    gap: 0.2em;
    padding: 0.1em 0.3em;
    border: 1px solid var(--rc-border-color, ButtonBorder);
    border-radius: var(--rc-radius-md, 0.25em);
    background: var(--rc-button-bg, ButtonFace);
    color: var(--rc-button-text, ButtonText);
    font: inherit;
    font-size: 0.875em;
    cursor: pointer;

    &:hover {
      background: var(--rc-highlight, Highlight);
      color: var(--rc-highlight-text, HighlightText);
    }

    &:focus-visible {
      outline: auto;
    }
  }

  /* Decorative × icon inside the chip — no interaction, aria-hidden */
  [part='chip-remove'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1em;
    font-size: 0.85em;
    pointer-events: none;
  }

  /* Hidden native select slot */
  slot[name='select'] {
    display: none;
  }

  /* Listbox popup — positioned by AnchorController via adoptedStyleSheets */
  rc-listbox {
    max-height: var(--rc-select-max-height, 20em);
    overflow-y: auto;
    background: var(--rc-surface, Canvas);
    border: 1px solid var(--rc-border-color, ButtonBorder);
    box-shadow: var(--rc-select-shadow, var(--rc-shadow, 0 2px 8px rgba(0,0,0,.15)));
    color: var(--rc-button-text, ButtonText);
    padding-block: 0.25em;

    &:not(:popover-open) {
      display: none;
    }
  }

  /* Options within the listbox */
  rc-listbox [part~='option'] {
    display: flex;
    align-items: center;
    gap: 0.4em;
    padding: 0.3em 0.75em;
    cursor: default;

    /* display: flex overrides [hidden]'s browser-default display:none — restore it explicitly */
    &[hidden] { display: none; }

    &:not([hidden]):not([aria-disabled='true']):hover {
      background: var(--rc-highlight, Highlight);
      color: var(--rc-highlight-text, HighlightText);
    }

    &[data-active]:not([aria-disabled='true']) {
      background: var(--rc-highlight, Highlight);
      color: var(--rc-highlight-text, HighlightText);
      outline: 2px solid var(--rc-accent, AccentColor);
      outline-offset: -2px;
    }

    &[aria-disabled='true'] {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  /* Selection checkmark — reserves space whether visible or not */
  rc-listbox [part~='option-checkmark'] {
    flex-shrink: 0;
    width: 1em;
    text-align: center;
    font-size: 0.85em;
    visibility: hidden;
  }

  rc-listbox [part~='option'][aria-selected='true'] [part~='option-checkmark'] {
    visibility: visible;
  }

  rc-listbox [part~='create-option'] {
    font-style: italic;
    border-top: 1px solid var(--rc-border-color, ButtonBorder);
    margin-top: 0.25em;
    padding-top: 0.3em;
  }
`;

export default selectStyles;
