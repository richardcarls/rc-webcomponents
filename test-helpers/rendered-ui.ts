export type LogicalInsets = {
  inlineStart: number;
  inlineEnd: number;
  blockStart: number;
  blockEnd: number;
};

export type OverflowFinding = {
  element: HTMLElement;
  axis: 'inline' | 'block';
  overflow: number;
};

export type OverflowAuditOptions = {
  /** Returns true only for overflow that the fixture intentionally permits. */
  ignore?: (element: HTMLElement) => boolean;
};

/** Returns physical geometry expressed as logical insets for horizontal writing modes. */
export function logicalInsets(outer: Element, inner: Element): LogicalInsets {
  const outerRect = outer.getBoundingClientRect();
  const innerRect = inner.getBoundingClientRect();
  const rtl = getComputedStyle(outer).direction === 'rtl';

  return {
    inlineStart: rtl ? outerRect.right - innerRect.right : innerRect.left - outerRect.left,
    inlineEnd: rtl ? innerRect.left - outerRect.left : outerRect.right - innerRect.right,
    blockStart: innerRect.top - outerRect.top,
    blockEnd: outerRect.bottom - innerRect.bottom,
  };
}

/**
 * Finds accidental element overflow while allowing intentional scroll containers.
 * Traverses open shadow roots so component internals participate in the audit.
 */
export function unexpectedOverflow(
  root: ParentNode,
  options: OverflowAuditOptions = {},
): OverflowFinding[] {
  const findings: OverflowFinding[] = [];

  for (const element of composedElements(root)) {
    if (options.ignore?.(element)) {
      continue;
    }

    const style = getComputedStyle(element);
    const inlineScrollable = ['auto', 'scroll'].includes(style.overflowX);
    const blockScrollable = ['auto', 'scroll'].includes(style.overflowY);
    const inlineOverflow = element.scrollWidth - element.clientWidth;
    const blockOverflow = element.scrollHeight - element.clientHeight;

    if (!inlineScrollable && inlineOverflow > 1) {
      findings.push({ element, axis: 'inline', overflow: inlineOverflow });
    }

    if (!blockScrollable && blockOverflow > 1) {
      findings.push({ element, axis: 'block', overflow: blockOverflow });
    }
  }

  return findings;
}

function composedElements(root: ParentNode): HTMLElement[] {
  const elements: HTMLElement[] = root instanceof HTMLElement ? [root] : [];

  for (const element of root.querySelectorAll<HTMLElement>('*')) {
    elements.push(element);

    if (element.shadowRoot) {
      elements.push(...composedElements(element.shadowRoot));
    }
  }

  return elements;
}
