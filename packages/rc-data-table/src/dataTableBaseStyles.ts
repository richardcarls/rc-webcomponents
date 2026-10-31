import { cssText, defineLightDomBaseStyles } from '@rcarls/rc-common';

/**
 * Light-DOM base styles for the sortable table.
 *
 * The consumer's `<table>` stays in light DOM. The host becomes the table's
 * inline scroll container; sort buttons fill their header cell and read as
 * header text; and a CSS indicator shows each column's sort state with a
 * distinct shape, as generated content with empty alternative text. Cell
 * padding and borders keep the user agent's defaults until a theme sets them.
 */
export const DATA_TABLE_BASE_CSS = cssText`
@layer rc-base {
  rc-data-table {
    display: block;
    max-inline-size: 100%;
    overflow-x: auto;
    overflow-inline: auto;
  }

  rc-data-table > table :is(th, td) {
    padding-block: var(--rc-data-table-cell-padding-block, revert);
    padding-inline: var(--rc-data-table-cell-padding-inline, revert);
  }

  rc-data-table > table th[data-rc-sort-key] > :is(button, a) {
    display: inline-flex;
    align-items: center;
    gap: var(--rc-data-table-sort-indicator-gap, 0.25em);
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: inherit;
    text-decoration: inherit;
    cursor: pointer;
  }

  rc-data-table > table th[data-rc-sort-key] > :is(button, a)::after {
    content: var(--rc-data-table-sort-none, '\\25C7') / '';
    font-size: 0.75em;
  }

  rc-data-table > table th[aria-sort='ascending'] > :is(button, a)::after {
    content: var(--rc-data-table-sort-ascending, '\\25B2') / '';
  }

  rc-data-table > table th[aria-sort='descending'] > :is(button, a)::after {
    content: var(--rc-data-table-sort-descending, '\\25BC') / '';
  }
}
`;

/** Installs the sortable table styles once per containing root. */
export const ensureDataTableBaseStyles: (root: Document | ShadowRoot) => void =
  defineLightDomBaseStyles('rc-data-table', DATA_TABLE_BASE_CSS);
