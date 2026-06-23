import { css } from 'lit';

export const comboboxStyles = css`
  :host {
    display: inline-block;
  }

  #anchor {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--rc-combobox-gap, var(--rc-control-gap, 0.25em));
    min-block-size: var(--rc-combobox-control-block-size, var(--rc-control-block-size, auto));
    border: var(
      --rc-combobox-border,
      var(--rc-border, 1px solid var(--rc-border-color, ButtonBorder))
    );
    border-radius: var(
      --rc-combobox-radius,
      var(--rc-control-radius, var(--rc-radius-sm, 0.125em))
    );
    background: var(--rc-field, Field);
    color: var(--rc-field-text, FieldText);
    padding: var(--rc-combobox-padding-block, calc(var(--rc-control-padding-block, 0.25em) / 2))
      var(--rc-combobox-padding-inline, calc(var(--rc-control-padding-inline, 0.5em) / 2));
    cursor: text;
    font-family: var(--rc-font-family, inherit);
    font-size: var(--rc-font-size, inherit);
    line-height: var(--rc-line-height, normal);
    transition:
      background-color var(--rc-motion-duration, 120ms),
      border-color var(--rc-motion-duration, 120ms),
      box-shadow var(--rc-motion-duration, 120ms);
  }

  /* Chips — the whole chip is the remove button for a larger touch target */
  [part='chip'] {
    display: inline-flex;
    align-items: center;
    gap: var(--rc-combobox-chip-gap, calc(var(--rc-control-gap, 0.25em) * 0.8));
    padding: var(--rc-combobox-chip-padding-block, 0.1em)
      var(--rc-combobox-chip-padding-inline, 0.3em);
    border: var(
      --rc-combobox-chip-border,
      var(--rc-border, 1px solid var(--rc-border-color, ButtonBorder))
    );
    border-radius: var(--rc-combobox-chip-radius, var(--rc-radius-md, 0.25em));
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

  #trigger {
    flex: 1;
    min-width: 6em;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    outline: none;
    padding: var(--rc-combobox-input-padding-block, var(--rc-control-padding-block, 0.25em))
      var(--rc-combobox-input-padding-inline, calc(var(--rc-control-padding-inline, 0.5em) / 2));
    cursor: text;
  }

  #trigger::placeholder {
    color: var(--rc-text-disabled, GrayText);
  }

  #toggle {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--rc-combobox-toggle-padding, var(--rc-control-padding-block, 0.25em));
    border: none;
    background: transparent;
    color: inherit;
    cursor: default;
    font-size: 0.75em;
    font: inherit;

    &:focus-visible {
      outline: var(--rc-focus-ring, auto);
      outline-offset: var(--rc-focus-ring-offset, 0);
    }
  }

  /* Hidden native select slot */
  slot[name='select'] {
    display: none;
  }

  /* Listbox popup — positioned by AnchorController via adoptedStyleSheets */
  rc-listbox {
    max-height: var(--rc-combobox-max-height, 20em);
    overflow-y: auto;
    background: var(--rc-surface, Canvas);
    border: var(
      --rc-combobox-listbox-border,
      var(--rc-border, 1px solid var(--rc-border-color, ButtonBorder))
    );
    border-radius: var(--rc-combobox-listbox-radius, var(--rc-control-radius, 0));
    box-shadow: var(
      --rc-combobox-shadow,
      var(--rc-shadow, 0 2px 8px color-mix(in srgb, CanvasText 15%, transparent))
    );
    color: var(--rc-field-text, FieldText);
    padding-block: var(
      --rc-combobox-listbox-padding-block,
      var(--rc-control-padding-block, 0.25em)
    );

    &:not(:popover-open) {
      display: none;
    }
  }

  rc-listbox [part~='option'] {
    display: flex;
    align-items: center;
    gap: var(--rc-item-gap, 0.4em);
    padding: var(--rc-item-padding-block, 0.3em) var(--rc-item-padding-inline, 0.75em);
    cursor: default;

    /* display: flex overrides [hidden]'s browser-default display:none — restore it explicitly */
    &[hidden] {
      display: none;
    }

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

export default comboboxStyles;
