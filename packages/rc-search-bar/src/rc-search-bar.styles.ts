import { css } from 'lit';

import { rcToken } from '@rcarls/rc-common';

export const searchBarStyles = css`
  :host {
    display: inline-flex;
    position: relative;
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
    gap: var(--rc-search-bar-gap, ${rcToken('--rc-control-gap')});
    block-size: var(--rc-search-bar-height, ${rcToken('--rc-control-block-size')});
    padding-inline: var(--rc-search-bar-padding-inline, ${rcToken('--rc-control-padding-inline')});
    border: var(--rc-search-bar-border, ${rcToken('--rc-border')});
    border-radius: var(--rc-search-bar-radius, ${rcToken('--rc-control-radius')});
    box-shadow: var(--rc-search-bar-shadow, none);
    background: var(--rc-search-bar-bg, ${rcToken('--rc-field')});
    color: var(--rc-search-bar-color, ${rcToken('--rc-field-text')});
    font-family: ${rcToken('--rc-font-family', 'inherit')};
    font-size: ${rcToken('--rc-font-size', 'inherit')};
    line-height: ${rcToken('--rc-line-height')};
    transition:
      background-color 120ms,
      border-color 120ms,
      box-shadow 120ms;
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
    font-size: var(--rc-search-bar-icon-size, inherit);
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
    outline: ${rcToken('--rc-focus-ring')};
    outline-offset: ${rcToken('--rc-focus-ring-offset')};
  }

  #view {
    position: absolute;
    z-index: 1;
    inset-block-start: calc(100% + var(--rc-search-bar-view-offset, 0.25rem));
    inset-inline: 0;
    min-inline-size: 100%;
  }

  #view-surface {
    box-sizing: border-box;
    padding-block: var(--rc-search-bar-view-padding-block, 0.5rem);
    border: var(
      --rc-search-bar-view-border,
      var(--rc-search-bar-border, ${rcToken('--rc-border')})
    );
    border-radius: var(
      --rc-search-bar-view-radius,
      var(--rc-search-bar-radius, ${rcToken('--rc-control-radius')})
    );
    box-shadow: var(--rc-search-bar-view-shadow, var(--rc-search-bar-shadow, none));
    background: var(--rc-search-bar-view-bg, var(--rc-search-bar-bg, ${rcToken('--rc-field')}));
    color: var(
      --rc-search-bar-view-color,
      var(--rc-search-bar-color, ${rcToken('--rc-field-text')})
    );
    font-family: ${rcToken('--rc-font-family', 'inherit')};
    font-size: ${rcToken('--rc-font-size', 'inherit')};
  }

  #view-surface.empty {
    display: none;
  }

  #suggestions {
    display: flex;
    flex-direction: column;
  }

  #suggestions ::slotted(*) {
    min-inline-size: 0;
  }

  [part='suggestion'] {
    display: flex;
    align-items: center;
    min-block-size: var(--rc-search-bar-suggestion-min-block-size, 2.75rem);
    padding-block: 0;
    padding-inline: var(--rc-search-bar-suggestion-padding-inline, 1rem);
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: start;
    cursor: pointer;
  }

  [part='suggestion']:hover,
  [part='suggestion']:focus-visible {
    background: var(--rc-search-bar-suggestion-hover-bg, ButtonFace);
  }

  [part='suggestion']:focus-visible {
    outline: ${rcToken('--rc-focus-ring')};
    outline-offset: ${rcToken('--rc-focus-ring-offset')};
  }
`;

export default searchBarStyles;
