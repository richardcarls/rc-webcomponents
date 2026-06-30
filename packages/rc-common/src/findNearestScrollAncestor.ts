/**
 * Walks up the DOM from `el` and returns the first ancestor whose computed
 * `overflow` or `overflow-y` is `auto` or `scroll`. Falls back to
 * `document.scrollingElement` (the root scroller) when no ancestor qualifies.
 *
 * Start the walk from `el.parentElement` when the element itself should not
 * be considered (e.g. a FAB looking for its containing scroll context).
 */
export function findNearestScrollAncestor(el: Element): Element {
  let cur: Element | null = el.parentElement;
  while (cur && cur !== document.documentElement) {
    const { overflow, overflowY } = getComputedStyle(cur);
    if (/auto|scroll/.test(overflowY) || /auto|scroll/.test(overflow)) return cur;
    cur = cur.parentElement;
  }
  return document.scrollingElement ?? document.documentElement;
}
