import { css } from 'lit';

export const comboboxStyles = css`
  :host {
    display: inline-block;
  }

  #anchor {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
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

  .value {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--rc-combobox-gap, var(--rc-control-gap, 0.25em));
    min-inline-size: 0;
  }

  [part='chips'] {
    flex: 0 1 auto;
    max-inline-size: 100%;
    min-inline-size: 0;
    --rc-chip-group-column-gap: var(--rc-combobox-gap, var(--rc-control-gap, 0.25em));
    --rc-chip-group-row-gap: 0;
  }

  /* Input-chip chrome; rc-chip keeps the native button as the removal action. */
  [part='chip'] {
    display: inline-flex;
    align-items: center;
    gap: var(--rc-combobox-chip-gap, calc(var(--rc-control-gap, 0.25em) * 0.8));
    padding-block: var(--rc-combobox-chip-padding-block, 0.1em);
    padding-inline-start: var(--rc-combobox-chip-padding-inline-start, 0.3em);
    padding-inline-end: var(
      --rc-combobox-chip-padding-inline-end,
      calc(
        var(--rc-chip-remove-target-size, 1.5rem) + var(--rc-chip-remove-offset-inline, 0.125rem)
      )
    );
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

  /* Decorative × icon inside the chip — no interaction, aria-hidden. */
  [part='chip-remove'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1em;
    font-size: 0.85em;
    pointer-events: none;
  }

  #trigger,
  [part~='dialog-input'] {
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

  #trigger::placeholder,
  [part~='dialog-input']::placeholder {
    color: var(--rc-text-disabled, GrayText);
  }

  #toggle {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: var(--rc-combobox-toggle-size, 1.1em);
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
    overflow-y: auto;
    overflow-block: auto;
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
  }

  [part='listbox'] {
    max-inline-size: var(--rc-anchor-viewport-inline-size, none);
    max-block-size: min(
      var(--rc-combobox-max-height, 20em),
      var(--rc-anchor-viewport-block-size, 20em)
    );
  }

  /*
   * Opacity only, deliberately not a scale/slide transform: AnchorController
   * (see rc-common) positions this listbox and applies its own
   * viewport-clamping translate to it, tracked against
   * getBoundingClientRect() to compute the next correction. A second,
   * CSS-driven transform on the same element and property would fight that
   * math on every open.
   *
   * display and overlay join the transition list, allow-discrete: without
   * them, this listbox's own separate display: none on :not(:popover-open)
   * (still needed for reduced motion, see below) would apply instantly, and
   * a transition on a property of an element with no box doesn't render at
   * all. Confirmed directly against rc-select's identical structure: an
   * opacity-only version of this rule measured display: none within 300ms
   * of a 2-second exit fade that should still have been running.
   */
  @media (prefers-reduced-motion: no-preference) {
    [part='listbox']:popover-open {
      opacity: 1;
      transition:
        opacity var(--rc-combobox-listbox-duration, 150ms)
          var(--rc-motion-effects-easing-enter, ease-out),
        overlay var(--rc-combobox-listbox-duration, 150ms) allow-discrete,
        display var(--rc-combobox-listbox-duration, 150ms) allow-discrete;
    }

    [part='listbox']:not(:popover-open) {
      opacity: 0;
      transition:
        opacity var(--rc-combobox-listbox-duration, 150ms)
          var(--rc-motion-effects-easing-exit, ease-in),
        overlay var(--rc-combobox-listbox-duration, 150ms) allow-discrete,
        display var(--rc-combobox-listbox-duration, 150ms) allow-discrete;
    }

    @starting-style {
      [part='listbox']:popover-open {
        opacity: 0;
      }
    }
  }

  [part='listbox']:not(:popover-open) {
    display: none;
  }

  rc-dialog[variant='fullscreen'] {
    display: contents;
  }

  [part~='dialog'] {
    box-sizing: border-box;
    background: var(--rc-surface, Canvas);
    color: var(--rc-field-text, CanvasText);
    font-family: var(--rc-font-family, inherit);

    &[open] {
      display: flex;
      flex-direction: column;
      gap: var(--rc-combobox-dialog-gap, 1rem);
    }
  }

  [part~='dialog-header'] {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--rc-combobox-dialog-header-gap, 0.5rem);
  }

  [part~='dialog-header'] > [part~='dialog-title']:first-child {
    grid-column: 1 / 3;
  }

  [part~='dialog-title'] {
    min-inline-size: 0;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font: inherit;
  }

  [part~='dialog-cancel'],
  [part~='dialog-confirm'] {
    min-inline-size: 2.75rem;
    min-block-size: 2.75rem;
  }

  [part~='dialog-cancel'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  [part~='dialog-cancel-icon'] {
    fill: currentColor;
  }

  [part~='dialog-selected'] {
    max-block-size: 30%;
    overflow: auto;
  }

  [part~='dialog-search'] {
    display: grid;
    gap: var(--rc-combobox-dialog-search-gap, 0.25rem);
  }

  [part~='dialog-input'] {
    box-sizing: border-box;
    inline-size: 100%;
    min-block-size: var(--rc-control-block-size, 2.75rem);
    padding: var(--rc-control-padding-block, 0.5rem) var(--rc-control-padding-inline, 0.75rem);
    border: var(
      --rc-combobox-dialog-input-border,
      var(--rc-border, 1px solid var(--rc-border-color, ButtonBorder))
    );
    border-radius: var(
      --rc-combobox-dialog-input-radius,
      var(--rc-control-radius, var(--rc-radius-sm, 0.125em))
    );
    background: var(--rc-combobox-dialog-input-background, var(--rc-field, Field));

    &:focus-visible {
      outline: var(--rc-focus-ring, auto);
      outline-offset: var(--rc-focus-ring-offset, 0);
    }
  }

  [part~='dialog-listbox'] {
    flex: 1;
    min-block-size: 0;
    max-block-size: none;
    box-shadow: none;
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
