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
    padding: var(--rc-combobox-padding-block, var(--rc-control-padding-block, 1px))
      var(--rc-combobox-padding-inline, var(--rc-control-padding-inline, 4px));
    min-width: 8em;
    cursor: text;
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
    font-family: var(--rc-font-family, inherit);
    font-size: var(--rc-font-size, inherit);
    line-height: var(--rc-line-height, normal);
    transition:
      background-color var(--rc-motion-duration, 120ms),
      border-color var(--rc-motion-duration, 120ms),
      box-shadow var(--rc-motion-duration, 120ms);

    /* Focus ring — anchor shows the ring when the internal input is focused */
    outline: none;
    &:focus-within {
      outline: var(--rc-focus-ring, auto);
      outline-offset: var(--rc-focus-ring-offset, 0);
    }
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
    min-width: 0;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    outline: none;
    padding: 0;
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
    inline-size: var(--rc-select-toggle-indicator-size, 1.1em);
    border: none;
    background: transparent;
    color: inherit;
    cursor: default;
    font: inherit;

    &:focus-visible {
      outline: var(--rc-focus-ring, auto);
      outline-offset: var(--rc-focus-ring-offset, 0);
    }
  }

  /* Hide the default slot — visually suppresses the slotted native <select> */
  slot:not([name]) {
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
    --rc-listbox-option-gap: var(--rc-item-gap, 0.4em);
    --rc-listbox-option-padding-block: var(--rc-item-padding-block, 0.3em);
    --rc-listbox-option-padding-inline: var(--rc-item-padding-inline, 0.75em);
    --rc-listbox-hover-bg: var(--rc-highlight, Highlight);
    --rc-listbox-hover-color: var(--rc-highlight-text, HighlightText);
    --rc-listbox-active-bg: var(--rc-highlight, Highlight);
    --rc-listbox-active-color: var(--rc-highlight-text, HighlightText);
    --rc-listbox-selected-bg: var(--rc-highlight, Highlight);
    --rc-listbox-selected-color: var(--rc-highlight-text, HighlightText);
    --rc-listbox-disabled-opacity: var(--rc-disabled-opacity, 0.5);

    &:not(:popover-open) {
      display: none;
    }
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
