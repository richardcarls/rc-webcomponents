/** One slot in a pagination list: a page number or a gap of hidden pages. */
export type PaginationItem = number | 'ellipsis';

export interface PaginationRangeOptions {
  /** The current page, 1-based. Clamped to `[1, total]`. */
  page: number;
  /** The number of pages. */
  total: number;
  /** Pages shown on each side of the current page. Defaults to 1. */
  siblings?: number;
  /** Pages always shown at each end. Defaults to 1. */
  boundaries?: number;
}

/**
 * The page numbers to render for a pagination list, with `'ellipsis'` where a
 * run of pages is hidden. A gap of a single page shows that page instead, so
 * an ellipsis always stands for at least two pages.
 *
 * Pure and DOM-free: import it from `@rcarls/rc-pagination/range` to build the
 * markup on a server without loading the element.
 *
 * @example
 * paginationRange({ page: 6, total: 12 }); // [1, 'ellipsis', 5, 6, 7, 'ellipsis', 12]
 */
export function paginationRange({
  page,
  total,
  siblings = 1,
  boundaries = 1,
}: PaginationRangeOptions): PaginationItem[] {
  const last = Math.max(0, Math.floor(total));

  if (last === 0) {
    return [];
  }

  const current = Math.min(Math.max(1, Math.floor(page)), last);
  const shown = new Set<number>();

  const add = (from: number, to: number) => {
    for (let value = Math.max(1, from); value <= Math.min(last, to); value += 1) {
      shown.add(value);
    }
  };

  add(1, boundaries);
  add(last - boundaries + 1, last);
  add(current - siblings, current + siblings);

  const pages = [...shown].sort((a, b) => a - b);
  const items: PaginationItem[] = [];

  for (const [index, value] of pages.entries()) {
    const previous = pages[index - 1];

    if (previous !== undefined && value - previous === 2) {
      items.push(previous + 1);
    } else if (previous !== undefined && value - previous > 2) {
      items.push('ellipsis');
    }

    items.push(value);
  }

  return items;
}
