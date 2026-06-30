import { css } from 'lit';

export const searchBarStyles = css`
  :host {
    display: inline-flex;
    color-scheme: inherit;
  }

  [hidden] {
    display: none !important;
  }

  #root {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    min-inline-size: 0;
    gap: var(--rc-search-bar-gap, var(--rc-control-gap, 0.25em));
    block-size: var(--rc-search-bar-height, var(--rc-control-block-size, 2.5rem));
    padding-inline: var(--rc-search-bar-padding-inline, var(--rc-control-padding-inline, 0.75rem));
    border: var(--rc-search-bar-border, var(--rc-border, 1px solid var(--rc-border-color, ButtonBorder)));
    border-radius: var(--rc-search-bar-radius, var(--rc-control-radius, var(--rc-radius-sm, 0.125em)));
    box-shadow: var(--rc-search-bar-shadow, none);
    background: var(--rc-search-bar-bg, var(--rc-field, Field));
    color: var(--rc-search-bar-color, var(--rc-field-text, FieldText));
    font-family: var(--rc-font-family, inherit);
    font-size: var(--rc-font-size, inherit);
    line-height: var(--rc-line-height, normal);
    transition: background-color 120ms, border-color 120ms, box-shadow 120ms;
  }

  :host([data-interaction-mode='keyboard']) #root:focus-within {
    outline: var(--rc-focus-ring, auto);
    outline-offset: var(--rc-focus-ring-offset, 0);
  }

  /* No slotted search input: render no chrome at all. */
  #root.empty {
    block-size: auto;
    padding: 0;
    background: none;
    border: none;
    box-shadow: none;
    border-radius: 0;
  }

  #leading {
    display: flex;
    flex: none;
    align-items: center;
    color: var(--rc-search-bar-icon-color, GrayText);
  }

  #leading.empty {
    display: none;
  }

  ::slotted(input[type='search']) {
    flex: 1 1 auto;
    min-inline-size: 0;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--rc-search-bar-input-color, inherit);
    font-family: var(--rc-search-bar-input-font-family, inherit);
    font-size: var(--rc-search-bar-input-font-size, inherit);
    outline: none;
    appearance: textfield;
  }

  #trailing {
    display: flex;
    flex: none;
    align-items: center;
  }

  #trailing.empty {
    display: none;
  }

  #clear {
    display: inline-grid;
    flex: none;
    place-items: center;
    min-inline-size: 24px;
    min-block-size: 24px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: none;
    color: var(--rc-search-bar-clear-color, GrayText);
    font: inherit;
    cursor: pointer;
  }

  #clear[inert] {
    visibility: hidden;
  }

  #clear:focus-visible {
    outline: var(--rc-focus-ring, auto);
    outline-offset: var(--rc-focus-ring-offset, 0);
  }
`;

export default searchBarStyles;
