import { cssText, defineLightDomBaseStyles } from '@rcarls/rc-common';

/**
 * Light-DOM base styles for the pagination list.
 *
 * The consumer's `<nav>`, list, and controls stay in light DOM. These rules lay
 * the list out as a wrapping inline row and give each control a minimum size;
 * themes supply the shape, color, and state layers.
 */
export const PAGINATION_BASE_CSS = cssText`
@layer rc-base {
  rc-pagination {
    display: block;
  }

  rc-pagination > nav > :is(ul, ol) {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--rc-pagination-gap, 0.25em);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  rc-pagination [data-rc-page] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-inline-size: var(--rc-pagination-item-min-inline-size, auto);
  }

  rc-pagination a[data-rc-page][aria-disabled='true'] {
    cursor: default;
  }
}
`;

/** Installs the pagination list styles once per containing root. */
export const ensurePaginationBaseStyles: (root: Document | ShadowRoot) => void =
  defineLightDomBaseStyles('rc-pagination', PAGINATION_BASE_CSS);
