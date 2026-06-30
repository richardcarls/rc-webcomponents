/**
 * Cursor save/restore for rc-textarea's contenteditable editor.
 *
 * The text model is a plain string with \n line separators.
 *
 * WidgetDecoration spans (.widget) are zero-width in the text model (not part
 * of the value string). <br> elements (used to make empty lines editable) count
 * as 0 characters.
 */

export interface SavedSelection {
  /** Anchor position as a character offset into the plain text value. */
  anchorOffset: number;

  /** Focus position as a character offset into the plain text value. */
  focusOffset: number;
}

/** Returns the text-model length of a DOM node and its descendants. */
function textModelLength($node: Node): number {
  if ($node.nodeType === Node.TEXT_NODE) {
    return ($node as Text).length;
  }

  if (!($node instanceof Element)) {
    return 0;
  }

  if ($node.classList.contains('widget')) {
    return 0;
  }

  if ($node.tagName === 'BR') {
    return 0;
  }

  let len = 0;
  for (const $child of $node.childNodes) {
    len += textModelLength($child);
  }

  return len;
}

/**
 * Converts a DOM (node, nodeOffset) pair inside `$root` to a plain-text offset.
 * Returns the end-of-content offset if the target was not found inside `$root`.
 */
export function domToTextOffset(
  $root: Element,
  $targetNode: Node,
  targetNodeOffset: number,
): number {
  const $lines = Array.from($root.querySelectorAll<HTMLElement>('.line'));

  let totalOffset = 0;
  for (let lineIdx = 0; lineIdx < $lines.length; lineIdx++) {
    if (lineIdx > 0) {
      totalOffset++; // \n between lines
    }

    const $line = $lines[lineIdx]!;
    const result = walkForOffset($line, $targetNode, targetNodeOffset, totalOffset);

    if (result.found) {
      return result.offset;
    }

    totalOffset += textModelLength($line);
  }

  // Target not found — fall back to end of content
  return totalOffset;
}

interface WalkResult {
  found: boolean;
  offset: number;
}

/**
 * Recursively walk the subtree rooted at `$node`, accumulating character
 * offsets until `$targetNode` / `targetNodeOffset` is found.
 *
 * Returns `{ found: true, offset }` when the target is located, or
 * `{ found: false, offset }` where `offset` is the cumulative length of all
 * text visited so far (allowing the caller to continue from where we left off).
 */
function walkForOffset(
  $node: Node,
  $targetNode: Node,
  targetNodeOffset: number,
  currentOffset: number,
): WalkResult {
  if ($node === $targetNode) {
    if ($node.nodeType === Node.TEXT_NODE) {
      return { found: true, offset: currentOffset + targetNodeOffset };
    }

    const $children = Array.from($node.childNodes);

    // Element node - targetNodeOffset is a child index
    let offset = currentOffset;
    for (let i = 0; i < targetNodeOffset && i < $children.length; i++) {
      offset += textModelLength($children[i]!);
    }

    return { found: true, offset: offset };
  }

  if ($node.nodeType === Node.TEXT_NODE) {
    return { found: false, offset: currentOffset + ($node as Text).length };
  }

  if ($node instanceof Element) {
    if ($node.classList.contains('widget')) {
      return { found: false, offset: currentOffset };
    }

    if ($node.tagName === 'BR') {
      return { found: false, offset: currentOffset };
    }

    let offset = currentOffset;
    for (const $child of $node.childNodes) {
      const result = walkForOffset($child, $targetNode, targetNodeOffset, offset);

      if (result.found) {
        return result;
      }

      offset = result.offset;
    }

    return { found: false, offset: offset };
  }

  return { found: false, offset: currentOffset };
}

interface DomPosition {
  node: Node;
  offset: number;
}

/**
 * Converts a plain-text offset to a (node, nodeOffset) DOM position inside `$root`.
 *
 * Returns null if offset is out of range.
 */
export function textOffsetToDom($root: Element, targetOffset: number): DomPosition | null {
  const $lines = Array.from($root.querySelectorAll<HTMLElement>('.line'));

  let localOffset = targetOffset;
  for (let i = 0; i < $lines.length; i++) {
    if (i > 0) {
      if (localOffset === 0) {
        // Position at boundary between lines — place at start of this line
        const $line = $lines[i]!;

        return { node: $line, offset: 0 };
      }

      localOffset--; // consume the \n
    }

    const $line = $lines[i]!;
    const lineLen = textModelLength($line);

    if (localOffset <= lineLen) {
      const pos = walkToOffset($line, localOffset);

      if (pos) {
        return pos;
      }

      // Cursor at end of line element
      return { node: $line, offset: $line.childNodes.length };
    }

    localOffset -= lineLen;
  }

  // Beyond end of content — place at end of last line
  const $line = $lines[$lines.length - 1];

  if ($line) {
    return { node: $line, offset: $line.childNodes.length };
  }

  return { node: $root, offset: $root.childNodes.length };
}

/**
 * Walk `$node`'s subtree to find the DOM position corresponding to
 * `localOffset` text-model characters from the start of `$node`.
 *
 * Returns a `{ node, offset }` pair suitable for a `Range` endpoint, or
 * `null` if the target falls beyond this subtree (caller must keep going).
 */
function walkToOffset($node: Node, localOffset: number): DomPosition | null {
  if ($node.nodeType === Node.TEXT_NODE) {
    const $textNode = $node as Text;

    if (localOffset <= $textNode.length) {
      return { node: $textNode, offset: localOffset };
    }

    return null;
  }

  if ($node instanceof Element) {
    if ($node.classList.contains('widget')) {
      return null;
    }

    if ($node.tagName === 'BR') {
      return null;
    }

    let offset = 0;
    for (const $child of $node.childNodes) {
      const length = textModelLength($child);

      if (localOffset <= length) {
        const result = walkToOffset($child, localOffset);

        if (result) {
          return result;
        }

        // Target is at boundary inside this child
        return { node: $node, offset: offset + 1 };
      }

      localOffset -= length;
      offset++;
    }
  }

  return null;
}

/**
 * Captures the current browser selection as plain-text offsets relative to `$root`.
 *
 * Returns null if there is no selection or the selection is outside `$root`.
 */
export function saveSelection($root: Element): SavedSelection | null {
  const $rootNode = $root.getRootNode();
  const selection =
    (
      $rootNode as unknown as { /* Chrome 53+ */ getSelection?: () => Selection | null }
    ).getSelection?.() ?? window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);

  if (!$root.contains(range.commonAncestorContainer)) {
    return null;
  }

  const anchorOffset = domToTextOffset($root, range.startContainer, range.startOffset);
  const focusOffset = domToTextOffset($root, range.endContainer, range.endOffset);

  return { anchorOffset, focusOffset };
}

/**
 * Restores a previously saved selection inside `$root`.
 *
 * Silently does nothing if the saved offsets are out of range.
 */
export function restoreSelection($root: Element, saved: SavedSelection): void {
  const anchor = textOffsetToDom($root, saved.anchorOffset);
  const focus = textOffsetToDom($root, saved.focusOffset);

  if (!anchor || !focus) {
    return;
  }

  try {
    const selection = window.getSelection();

    if (!selection) {
      return;
    }

    const range = document.createRange();

    range.setStart(anchor.node, anchor.offset);
    range.setEnd(focus.node, focus.offset);

    selection.removeAllRanges();
    selection.addRange(range);
  } catch {
    // setStart/setEnd can throw on invalid offsets — ignore gracefully
  }
}
