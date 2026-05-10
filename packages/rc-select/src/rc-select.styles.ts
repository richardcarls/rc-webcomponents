import { css } from 'lit';

export const selectStyles = css`
  :host {
    display: inline-block;
  }

  #anchor {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--rc-select-gap, var(--rc-control-gap, 0.25em));
  }

  #trigger {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--rc-select-gap, var(--rc-control-gap, 0.25em));
    min-block-size: var(--rc-select-control-block-size, var(--rc-control-block-size, auto));
    padding: var(--rc-select-padding-block, var(--rc-control-padding-block, 0.25em))
      var(--rc-select-padding-inline, var(--rc-control-padding-inline, 0.5em));
    min-width: 8em;
    cursor: default;
    user-select: none;
    border: var(--rc-select-border, var(--rc-border, 1px solid var(--rc-border-color, ButtonBorder)));
    border-radius: var(--rc-select-radius, var(--rc-control-radius, var(--rc-radius-sm, 0.125em)));
    background: var(--rc-field, Field);
    color: var(--rc-field-text, FieldText);
    font-family: var(--rc-font-family, inherit);
    font-size: var(--rc-font-size, inherit);
    line-height: var(--rc-line-height, normal);
    transition:
      background-color var(--rc-motion-duration, 120ms),
      border-color var(--rc-motion-duration, 120ms),
      box-shadow var(--rc-motion-duration, 120ms);

    /* Keyboard focus indicator */
    outline: none;
    &:focus-visible {
      outline: var(--rc-focus-ring, auto);
      outline-offset: var(--rc-focus-ring-offset, 0);
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
    gap: var(--rc-select-chip-gap, calc(var(--rc-control-gap, 0.25em) * 0.8));
    padding: var(--rc-select-chip-padding-block, 0.1em)
      var(--rc-select-chip-padding-inline, 0.3em);
    border: var(--rc-select-chip-border, var(--rc-border, 1px solid var(--rc-border-color, ButtonBorder)));
    border-radius: var(--rc-select-chip-radius, var(--rc-radius-md, 0.25em));
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
      outline: var(--rc-focus-ring, auto);
      outline-offset: var(--rc-focus-ring-offset, 0);
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
    border: var(--rc-select-listbox-border, var(--rc-border, 1px solid var(--rc-border-color, ButtonBorder)));
    border-radius: var(--rc-select-listbox-radius, var(--rc-control-radius, 0));
    box-shadow: var(--rc-select-shadow, var(--rc-shadow, 0 2px 8px color-mix(in srgb, CanvasText 15%, transparent)));
    color: var(--rc-field-text, FieldText);
    padding-block: var(--rc-select-listbox-padding-block, var(--rc-control-padding-block, 0.25em));

    &:not(:popover-open) {
      display: none;
    }
  }

  /* Options within the listbox */
  rc-listbox [part~='option'] {
    display: flex;
    align-items: center;
    gap: var(--rc-item-gap, 0.4em);
    padding: var(--rc-item-padding-block, 0.3em) var(--rc-item-padding-inline, 0.75em);
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
      outline: var(--rc-focus-ring, 2px solid var(--rc-accent, Highlight));
      outline-offset: -2px;
    }

    &[aria-disabled='true'] {
      opacity: var(--rc-disabled-opacity, 0.5);
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
