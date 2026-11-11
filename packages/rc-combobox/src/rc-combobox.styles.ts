import { css } from 'lit';

import { rcToken } from '@rcarls/rc-common';

export const comboboxStyles = css`
  :host {
    display: inline-block;
  }

  #anchor {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--rc-combobox-gap, ${rcToken('--rc-control-gap')});
    min-block-size: var(--rc-combobox-control-block-size, ${rcToken('--rc-control-block-size')});
    padding: var(--rc-combobox-padding-block, ${rcToken('--rc-control-padding-block')})
      var(--rc-combobox-padding-inline, ${rcToken('--rc-control-padding-inline')});
    min-width: 8em;
    cursor: text;
    border: var(--rc-combobox-border, ${rcToken('--rc-border')});
    border-radius: var(--rc-combobox-radius, ${rcToken('--rc-control-radius')});
    background: ${rcToken('--rc-field')};
    color: ${rcToken('--rc-field-text')};
    font-family: ${rcToken('--rc-font-family', 'inherit')};
    font-size: ${rcToken('--rc-font-size', 'inherit')};
    line-height: ${rcToken('--rc-line-height')};
    transition:
      background-color ${rcToken('--rc-motion-duration')},
      border-color ${rcToken('--rc-motion-duration')},
      box-shadow ${rcToken('--rc-motion-duration')};

    /* Focus ring — anchor shows the ring when the internal input is focused */
    outline: none;
    &:focus-within {
      outline: ${rcToken('--rc-focus-ring')};
      outline-offset: ${rcToken('--rc-focus-ring-offset')};
    }
  }

  .value {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--rc-combobox-gap, ${rcToken('--rc-control-gap')});
    min-inline-size: 0;
  }

  [part='chips'] {
    flex: 0 1 auto;
    max-inline-size: 100%;
    min-inline-size: 0;
    --rc-chip-group-column-gap: var(--rc-combobox-gap, ${rcToken('--rc-control-gap')});
    /*
     * Chip touch-target overlap tokens inherit to every chip, but they are
     * only meant to reach into the field's own block padding. Returning the
     * same space between rows keeps interior rows on the full touch-target
     * pitch instead of collapsing them onto each other.
     */
    --rc-chip-group-row-gap: calc(
      var(--rc-chip-touch-target-overlap-block-start, 0px) +
        var(--rc-chip-touch-target-overlap-block-end, 0px)
    );
  }

  /* Input-chip chrome; rc-chip keeps the native button as the removal action. */
  [part='chip'] {
    display: inline-flex;
    align-items: center;
    gap: var(--rc-combobox-chip-gap, calc(${rcToken('--rc-control-gap')} * 0.8));
    padding-block: var(--rc-combobox-chip-padding-block, 0.1em);
    padding-inline-start: var(--rc-combobox-chip-padding-inline-start, 0.3em);
    padding-inline-end: var(
      --rc-combobox-chip-padding-inline-end,
      calc(
        var(--rc-chip-remove-target-size, 1.5rem) + var(--rc-chip-remove-offset-inline, 0.125rem)
      )
    );
    border: var(--rc-combobox-chip-border, ${rcToken('--rc-border')});
    border-radius: var(--rc-combobox-chip-radius, ${rcToken('--rc-radius-md')});
    background: ${rcToken('--rc-button-bg')};
    color: ${rcToken('--rc-button-text')};
    font: inherit;
    font-size: 0.875em;
    cursor: pointer;

    &:hover {
      background: ${rcToken('--rc-highlight')};
      color: ${rcToken('--rc-highlight-text')};
    }

    &:focus-visible {
      outline: ${rcToken('--rc-focus-ring')};
      outline-offset: ${rcToken('--rc-focus-ring-offset')};
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
    color: ${rcToken('--rc-text-disabled')};
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
      outline: ${rcToken('--rc-focus-ring')};
      outline-offset: ${rcToken('--rc-focus-ring-offset')};
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
    background: var(--rc-combobox-listbox-background, ${rcToken('--rc-popup-background')});
    border: var(--rc-combobox-listbox-border, ${rcToken('--rc-popup-border')});
    border-radius: var(--rc-combobox-listbox-radius, ${rcToken('--rc-popup-radius')});
    box-shadow: var(--rc-combobox-shadow, ${rcToken('--rc-popup-shadow')});
    color: var(--rc-combobox-listbox-color, ${rcToken('--rc-popup-color')});
    padding-block: var(--rc-combobox-listbox-padding-block, ${rcToken('--rc-popup-padding-block')});
    --rc-listbox-option-gap: ${rcToken('--rc-item-gap')};
    --rc-listbox-option-padding-block: ${rcToken('--rc-item-padding-block')};
    --rc-listbox-option-padding-inline: ${rcToken('--rc-item-padding-inline')};
    --rc-listbox-hover-bg: ${rcToken('--rc-highlight')};
    --rc-listbox-hover-color: ${rcToken('--rc-highlight-text')};
    --rc-listbox-active-bg: ${rcToken('--rc-highlight')};
    --rc-listbox-active-color: ${rcToken('--rc-highlight-text')};
    --rc-listbox-selected-bg: ${rcToken('--rc-highlight')};
    --rc-listbox-selected-color: ${rcToken('--rc-highlight-text')};
    --rc-listbox-disabled-opacity: ${rcToken('--rc-disabled-opacity')};
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
          ${rcToken('--rc-motion-effects-easing-enter')},
        overlay var(--rc-combobox-listbox-duration, 150ms) allow-discrete,
        display var(--rc-combobox-listbox-duration, 150ms) allow-discrete;
    }

    [part='listbox']:not(:popover-open) {
      opacity: 0;
      transition:
        opacity var(--rc-combobox-listbox-duration, 150ms)
          ${rcToken('--rc-motion-effects-easing-exit')},
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
    background: ${rcToken('--rc-surface')};
    color: ${rcToken('--rc-field-text')};
    font-family: ${rcToken('--rc-font-family', 'inherit')};

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
    min-block-size: ${rcToken('--rc-control-block-size')};
    padding: ${rcToken('--rc-control-padding-block')} ${rcToken('--rc-control-padding-inline')};
    border: var(--rc-combobox-dialog-input-border, ${rcToken('--rc-border')});
    border-radius: var(--rc-combobox-dialog-input-radius, ${rcToken('--rc-control-radius')});
    background: var(--rc-combobox-dialog-input-background, ${rcToken('--rc-field')});

    &:focus-visible {
      outline: ${rcToken('--rc-focus-ring')};
      outline-offset: ${rcToken('--rc-focus-ring-offset')};
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

  rc-listbox [part~='option'][data-rc-active]:not([aria-disabled='true']) {
    outline: ${rcToken('--rc-focus-ring')};
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
    border-top: 1px solid ${rcToken('--rc-border-color')};
    margin-top: 0.25em;
    padding-top: 0.3em;
  }
`;

export default comboboxStyles;
