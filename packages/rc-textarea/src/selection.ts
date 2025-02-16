/**
 * Cursor save/restore for rc-textarea's contenteditable editor.
 *
 * The text model is a plain string with \n line separators.
 * WidgetDecoration spans (.v2-widget) are skipped — they are zero-width in
 * the text model (not part of the value string).
 * <br> elements (used to make empty lines editable) count as 0 characters.
 */

export interface SavedSelection {
  /** Anchor position as a character offset into the plain text value. */
  anchorOffset: number;
  /** Focus position as a character offset into the plain text value. */
  focusOffset: number;
}

// ── Text length helpers ───────────────────────────────────────────────────────

/** Returns the text-model length of a DOM node and its descendants. */
function textModelLength(node: Node): number {
  if (node.nodeType === Node.TEXT_NODE) return (node as Text).length;
  if (!(node instanceof Element)) return 0;
  if (node.classList.contains('v2-widget')) return 0;
  if (node.tagName === 'BR') return 0;
  let len = 0;
  for (const child of node.childNodes) len += textModelLength(child);
  return len;
}

// ── DOM → text offset ─────────────────────────────────────────────────────────

/**
 * Converts a DOM (node, nodeOffset) pair inside `root` to a plain-text offset.
 * Returns -1 if the target was not found inside root.
 */
export function domToTextOffset(
  root: Element,
  targetNode: Node,
  targetNodeOffset: number,
): number {
  const lines = Array.from(root.querySelectorAll<HTMLElement>('.v2-line'));
  let totalOffset = 0;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    if (lineIdx > 0) totalOffset++; // \n between lines

    const line = lines[lineIdx]!;
    const result = walkForOffset(
      line,
      targetNode,
      targetNodeOffset,
      totalOffset,
    );

    if (result.found) return result.offset;
    totalOffset += textModelLength(line);
  }

  // Target not found — fall back to end of content
  return totalOffset;
}

interface WalkResult {
  found: boolean;
  offset: number;
}

function walkForOffset(
  node: Node,
  targetNode: Node,
  targetNodeOffset: number,
  currentOffset: number,
): WalkResult {
  if (node === targetNode) {
    // Found the target node
    if (node.nodeType === Node.TEXT_NODE) {
      return { found: true, offset: currentOffset + targetNodeOffset };
    }
    // Element node — targetNodeOffset is a child index
    let off = currentOffset;
    const children = Array.from(node.childNodes);
    for (let i = 0; i < targetNodeOffset && i < children.length; i++) {
      off += textModelLength(children[i]!);
    }
    return { found: true, offset: off };
  }

  if (node.nodeType === Node.TEXT_NODE) {
    return { found: false, offset: currentOffset + (node as Text).length };
  }

  if (node instanceof Element) {
    if (node.classList.contains('v2-widget')) {
      return { found: false, offset: currentOffset };
    }
    if (node.tagName === 'BR') {
      return { found: false, offset: currentOffset };
    }

    let off = currentOffset;
    for (const child of node.childNodes) {
      const result = walkForOffset(child, targetNode, targetNodeOffset, off);
      if (result.found) return result;
      off = result.offset;
    }
    return { found: false, offset: off };
  }

  return { found: false, offset: currentOffset };
}

// ── Text offset → DOM position ────────────────────────────────────────────────

interface DomPosition {
  node: Node;
  offset: number;
}

/**
 * Converts a plain-text offset to a (node, nodeOffset) DOM position inside `root`.
 * Returns null if offset is out of range.
 */
export function textOffsetToDom(
  root: Element,
  targetOffset: number,
): DomPosition | null {
  const lines = Array.from(root.querySelectorAll<HTMLElement>('.v2-line'));
  let remaining = targetOffset;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    if (lineIdx > 0) {
      if (remaining === 0) {
        // Position at boundary between lines — place at start of this line
        const line = lines[lineIdx]!;
        return { node: line, offset: 0 };
      }
      remaining--; // consume the \n
    }

    const line = lines[lineIdx]!;
    const lineLen = textModelLength(line);

    if (remaining <= lineLen) {
      const pos = walkToOffset(line, remaining);
      if (pos) return pos;
      // Cursor at end of line element
      return { node: line, offset: line.childNodes.length };
    }

    remaining -= lineLen;
  }

  // Beyond end of content — place at end of last line
  const lastLine = lines[lines.length - 1];
  if (lastLine) return { node: lastLine, offset: lastLine.childNodes.length };
  return { node: root, offset: root.childNodes.length };
}

function walkToOffset(node: Node, remaining: number): DomPosition | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const textNode = node as Text;
    if (remaining <= textNode.length)
      return { node: textNode, offset: remaining };
    return null;
  }

  if (node instanceof Element) {
    if (node.classList.contains('v2-widget')) return null;
    if (node.tagName === 'BR') return null;

    let childOffset = 0;
    for (const child of node.childNodes) {
      const childLen = textModelLength(child);
      if (remaining <= childLen) {
        const result = walkToOffset(child, remaining);
        if (result) return result;
        // Target is at boundary inside this child
        return { node: node, offset: childOffset + 1 };
      }
      remaining -= childLen;
      childOffset++;
    }
  }

  return null;
}

// ── Save / Restore ────────────────────────────────────────────────────────────

/**
 * Captures the current browser selection as plain-text offsets relative to `root`.
 * Returns null if there is no selection or the selection is outside `root`.
 */
export function saveSelection(root: Element): SavedSelection | null {
  // Chrome does not expose shadow-DOM selections via window.getSelection().
  // Use shadowRoot.getSelection() when available, falling back to window.getSelection().
  const rootNode = root.getRootNode();
  const sel =
    (rootNode as unknown as { getSelection?: () => Selection | null })
      .getSelection?.() ?? window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  const range = sel.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;

  const anchorOffset = domToTextOffset(
    root,
    range.startContainer,
    range.startOffset,
  );
  const focusOffset = domToTextOffset(
    root,
    range.endContainer,
    range.endOffset,
  );

  return { anchorOffset, focusOffset };
}

/**
 * Restores a previously saved selection inside `root`.
 * Silently does nothing if the saved offsets are out of range.
 */
export function restoreSelection(root: Element, saved: SavedSelection): void {
  const anchor = textOffsetToDom(root, saved.anchorOffset);
  const focus = textOffsetToDom(root, saved.focusOffset);
  if (!anchor || !focus) return;

  try {
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.setStart(anchor.node, anchor.offset);
    range.setEnd(focus.node, focus.offset);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch {
    // setStart/setEnd can throw on invalid offsets — ignore gracefully
  }
}
