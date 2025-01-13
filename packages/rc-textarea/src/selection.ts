/**
 * Selection preservation for the contenteditable editor.
 *
 * The editor renders flat HTML: text nodes (with '\n' as line separators),
 * mark decoration spans (transparent to the text model), widget spans
 * (contenteditable="false" data-widget-text="..."), and optionally inline
 * diagnostic spans (contenteditable="false" without data-widget-text, skipped).
 * No .line wrapper divs.
 *
 * Character offsets are plain-text positions:
 *   - Every text character (including '\n') counts as 1
 *   - Widget spans contribute their data-widget-text.length
 *   - All other contenteditable="false" elements (diagnostics etc.) contribute 0
 *   - Mark spans are transparent — only their text content is counted
 */

/** True if `node` is a widget span. */
function isWidget(node: Node): node is HTMLElement {
  return node instanceof HTMLElement && node.dataset.widgetText !== undefined;
}

/**
 * Total character length contributed by `node` to the plain-text model.
 * Used to advance the accumulator when a subtree does not contain the target.
 */
function charLen(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) return (node as Text).length;
  if (isWidget(node)) return (node as HTMLElement).dataset.widgetText!.length;
  if (node instanceof Element && node.getAttribute('contenteditable') === 'false') return 0;
  let len = 0;
  for (const child of node.childNodes) len += charLen(child);
  return len;
}

/**
 * Search the subtree rooted at `node` for `targetNode`/`targetOffset`.
 * `base` is the number of plain-text characters before the start of this subtree.
 * Returns the absolute character offset if found, null otherwise.
 */
function walkToOffset(
  node: Node,
  targetNode: Node,
  targetOffset: number,
  base: number,
): number | null {
  if (node === targetNode) {
    if (node.nodeType === Node.TEXT_NODE) return base + targetOffset;
    if (isWidget(node)) {
      const wlen = (node as HTMLElement).dataset.widgetText!.length;
      return base + (targetOffset === 0 ? 0 : wlen);
    }
    // Element boundary: cursor is at child index targetOffset within this element
    let acc = base;
    let i = 0;
    for (const child of node.childNodes) {
      if (i++ === targetOffset) return acc;
      acc += charLen(child);
    }
    return acc;
  }

  // Leaf nodes that are not the target
  if (node.nodeType === Node.TEXT_NODE) return null;
  if (isWidget(node)) return null;
  if (node instanceof Element && node.getAttribute('contenteditable') === 'false') return null;

  // Transparent element (mark span, or the editor root): recurse into children
  let acc = base;
  for (const child of node.childNodes) {
    const found = walkToOffset(child, targetNode, targetOffset, acc);
    if (found !== null) return found;
    acc += charLen(child);
  }
  return null;
}

/**
 * Search the subtree rooted at `node` for the DOM position corresponding to
 * `remaining` plain-text characters from the start of this subtree.
 * Returns `{ node, offset }` for `Range.setStart`/`setEnd`, or null if the
 * position falls after this subtree (caller should subtract this subtree's
 * charLen and continue).
 */
function walkFromOffset(
  node: Node,
  remaining: number,
): { node: Node; offset: number } | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node as Text;
    // Special case: the target offset is exactly at the end of a text node
    // whose last character is '\n'.  Returning the element-boundary position
    // (AFTER the text node inside its parent) instead of offset=text.length
    // inside the text node lets browsers correctly render the cursor on the
    // new empty line rather than ambiguously at the tail of the previous line.
    if (
      remaining === text.length &&
      text.length > 0 &&
      text.data[text.length - 1] === '\n' &&
      node.parentNode
    ) {
      let idx = 0;
      let sib = node.previousSibling;
      while (sib !== null) { idx++; sib = sib.previousSibling; }
      return { node: node.parentNode, offset: idx + 1 };
    }
    if (remaining <= text.length) return { node, offset: remaining };
    return null;
  }

  if (isWidget(node)) {
    const len = (node as HTMLElement).dataset.widgetText!.length;
    if (remaining <= len) {
      // Widget is atomic: position before (remaining===0) or after (remaining>0)
      const parent = node.parentNode!;
      const idx = Array.from(parent.childNodes).indexOf(node as ChildNode);
      return { node: parent, offset: remaining === 0 ? idx : idx + 1 };
    }
    return null;
  }

  if (node instanceof Element && node.getAttribute('contenteditable') === 'false') return null;

  // Transparent element: iterate children
  for (const child of node.childNodes) {
    const childLen = charLen(child);
    if (remaining <= childLen) return walkFromOffset(child, remaining);
    remaining -= childLen;
  }

  // Position is at or past the end of this element
  return { node, offset: node.childNodes.length };
}

/**
 * Convert a DOM position (node + offset) inside the editor to an absolute
 * character offset in the plain-text model.
 */
export function getEditorOffset(
  editor: HTMLElement,
  node: Node,
  nodeOffset: number,
): number {
  return walkToOffset(editor, node, nodeOffset, 0) ?? 0;
}

/**
 * Convert an absolute character offset back to a DOM position
 * `{ node, offset }` suitable for `Range.setStart` / `Range.setEnd`.
 */
export function setEditorOffset(
  editor: HTMLElement,
  targetOffset: number,
): { node: Node; offset: number } {
  return (
    walkFromOffset(editor, targetOffset) ?? {
      node: editor,
      offset: editor.childNodes.length,
    }
  );
}

/**
 * Save the current selection inside `editor` as plain-text character offsets.
 * Returns null if there is no selection or the selection is outside the editor.
 */
export function saveSelection(
  editor: HTMLElement,
): { start: number; end: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return null;

  const start = getEditorOffset(editor, range.startContainer, range.startOffset);
  const end = range.collapsed
    ? start
    : getEditorOffset(editor, range.endContainer, range.endOffset);

  return { start, end };
}

/**
 * Restore a selection from saved plain-text character offsets.
 * No-ops if the editor is empty (e.g. before first render).
 */
export function restoreSelection(
  editor: HTMLElement,
  saved: { start: number; end: number },
): void {
  const sel = window.getSelection();
  if (!sel) return;

  const startPos = setEditorOffset(editor, saved.start);
  const endPos =
    saved.end === saved.start ? startPos : setEditorOffset(editor, saved.end);

  try {
    const range = document.createRange();
    range.setStart(startPos.node, startPos.offset);
    range.setEnd(endPos.node, endPos.offset);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch {
    // DOM may have changed; silently ignore
  }
}
