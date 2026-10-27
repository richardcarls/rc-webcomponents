/**
 * Walks up composed ancestry from `el` and returns the first ancestor whose computed
 * `overflow` or `overflow-y` is `auto` or `scroll`. Falls back to
 * `document.scrollingElement` (the root scroller) when no ancestor qualifies.
 *
 * Starts outside `el`, follows assigned slots and shadow hosts, and uses the
 * element's owner document for the root-scroller fallback.
 */
export function findNearestScrollAncestor(el: Element): Element {
  const document = el.ownerDocument;
  let cur = composedParent(el);

  while (cur && cur !== document.documentElement) {
    const { overflow, overflowY } = getComputedStyle(cur);

    if (/auto|scroll/.test(overflowY) || /auto|scroll/.test(overflow)) {
      return cur;
    }

    cur = composedParent(cur);
  }

  return document.scrollingElement ?? document.documentElement;
}

/** Parent in rendered ancestry, including slot assignment and shadow boundaries. */
function composedParent($element: Element): Element | null {
  if ($element.assignedSlot) {
    return $element.assignedSlot;
  }

  if ($element.parentElement) {
    return $element.parentElement;
  }

  const root = $element.getRootNode();

  return root instanceof ShadowRoot ? root.host : null;
}
