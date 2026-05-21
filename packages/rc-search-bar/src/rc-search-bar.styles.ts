import { css } from 'lit';

export const searchBarStyles = css`
  :host {
    display: inline-flex;
  }

  [hidden] {
    display: none !important;
  }

  #root {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    min-inline-size: 0;
    gap: var(--rc-search-bar-gap, 0.25em);
    block-size: var(--rc-search-bar-height, 48px);
    padding-inline: var(--rc-search-bar-padding-inline, 0.5em);
    background: var(--rc-search-bar-bg, Field);
    color: var(--rc-search-bar-color, FieldText);
    border-radius: var(--rc-search-bar-radius, var(--rc-control-radius, 0));
  }

  /* because :has(:focus-visible) doesn't work across the slot boundary */
  #root:focus-within {
    outline: var(--rc-focus-ring, auto);
    outline-offset: var(--rc-focus-ring-offset, 0);
  }

  /* No slotted search input: render no chrome at all. */
  #root.empty {
    block-size: auto;
    padding: 0;
    background: none;
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

  #clear:focus-visible {
    outline: var(--rc-focus-ring, auto);
    outline-offset: var(--rc-focus-ring-offset, 0);
  }
`;

export default searchBarStyles;
