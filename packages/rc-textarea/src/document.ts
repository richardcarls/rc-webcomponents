/**
 * RCDocument — manages the Parchment-backed contenteditable editor DOM.
 *
 * Maintains a RCScrollBlot as document root (wrapping the #editor div).
 * build() tears down the current tree and reconstructs it from plain text +
 * a flat array of decorations. DOM is built directly using the blots'
 * static create() methods for efficiency.
 *
 * @see {@link https://github.com/quilljs/parchment Parchment on GitHub}
 */
import { RCScrollBlot, RCBlockBlot, RCInlineBlot, RCWidgetBlot, createRegistry } from './blots.ts';
import type { Decoration, MarkDecoration, LineDecoration, WidgetDecoration } from './types.ts';

/**
 * Builds the child DOM of a line element given the line text, absolute line
 * start offset, and all decorations that affect this line.
 */
function buildLineContent(
  $line: HTMLElement,
  lineText: string,
  lineStart: number,
  markDecorations: MarkDecoration[],
  widgetDecorations: WidgetDecoration[],
): void {
  if (lineText.length === 0) {
    // Empty line needs a <br> so contenteditable allows cursor placement
    $line.appendChild(document.createElement('br'));

    return;
  }

  // Collect segment boundary points from all mark decoration edges
  const boundarySet = new Set<number>([0, lineText.length]);

  for (const decoration of markDecorations) {
    boundarySet.add(Math.max(0, decoration.from - lineStart));
    boundarySet.add(Math.min(lineText.length, decoration.to - lineStart));
  }

  for (const decoration of widgetDecorations) {
    const localOffset = decoration.offset - lineStart;

    if (localOffset >= 0 && localOffset <= lineText.length) {
      boundarySet.add(localOffset);
    }
  }

  const boundaries = [...boundarySet].sort((a, b) => a - b);

  for (let i = 0; i < boundaries.length - 1; i++) {
    const segmentStart = boundaries[i]!;
    const segmentEnd = boundaries[i + 1]!;

    // Insert widgets whose position falls at segmentStart ('before' side)
    for (const widget of widgetDecorations) {
      const localOffset = widget.offset - lineStart;

      if (localOffset === segmentStart && (widget.side ?? 'before') === 'before') {
        $line.appendChild(createWidget(widget));
      }
    }

    const segment = lineText.slice(segmentStart, segmentEnd);

    if (!segment) {
      continue;
    }

    // Find the innermost (smallest) mark decoration fully covering [segmentStart, segmentEnd)
    let bestDecoration: MarkDecoration | undefined;
    let bestSize = Infinity;

    for (const decoration of markDecorations) {
      const localFrom = decoration.from - lineStart;
      const localTo = decoration.to - lineStart;

      if (localFrom <= segmentStart && localTo >= segmentEnd) {
        const size = localTo - localFrom;

        if (size < bestSize) {
          bestSize = size;
          bestDecoration = decoration;
        }
      }
    }

    if (bestDecoration) {
      const $span = RCInlineBlot.create(bestDecoration) as HTMLSpanElement;

      if (bestDecoration.attributes) {
        for (const [attrName, attrValue] of Object.entries(bestDecoration.attributes)) {
          $span.setAttribute(attrName, attrValue);
        }
      }

      $span.appendChild(document.createTextNode(segment));

      $line.appendChild($span);
    } else {
      $line.appendChild(document.createTextNode(segment));
    }

    // Insert 'after' widgets at segEnd
    for (const widget of widgetDecorations) {
      const localOffset = widget.offset - lineStart;

      if (localOffset === segmentEnd && widget.side === 'after') {
        $line.appendChild(createWidget(widget));
      }
    }
  }

  // Widgets at very end of line (default 'before' side)
  for (const widget of widgetDecorations) {
    const localOffset = widget.offset - lineStart;

    if (localOffset === lineText.length && (widget.side ?? 'before') === 'before') {
      $line.appendChild(createWidget(widget));
    }
  }
}

/** Create the `.widget` span wrapper for a `WidgetDecoration`. */
function createWidget(decoration: WidgetDecoration): HTMLSpanElement {
  const $span = RCWidgetBlot.create() as HTMLSpanElement;

  $span.appendChild(decoration.create());

  return $span;
}

export class RCDocument {
  private readonly scroll: RCScrollBlot;

  constructor($documentRoot: HTMLDivElement) {
    const registry = createRegistry();

    this.scroll = new RCScrollBlot(registry, $documentRoot);
  }

  /**
   * Rebuild the document tree.
   *
   * Reuses existing `.line` elements in place to preserve DOM identity
   * across renders (fixes DevTools node tracking and mouse gesture continuity).
   */
  build(value: string, decorations: Decoration[]): void {
    const $documentRoot = this.scroll.domNode as HTMLElement;
    const lines = value.split('\n');

    // Snapshot existing line elements for reuse
    const $lines = Array.from($documentRoot.querySelectorAll<HTMLElement>('.line'));

    // Index decorations by type for fast per-line lookup
    const lineDecorationsMap = new Map<number, LineDecoration[]>();
    const markDecorations: MarkDecoration[] = [];
    const widgetDecorations: WidgetDecoration[] = [];

    for (const decoration of decorations) {
      if (decoration.type === 'line') {
        const lineDecorations = lineDecorationsMap.get(decoration.line) ?? [];

        lineDecorations.push(decoration);

        lineDecorationsMap.set(decoration.line, lineDecorations);
      } else if (decoration.type === 'mark') {
        markDecorations.push(decoration);
      } else {
        widgetDecorations.push(decoration);
      }
    }

    markDecorations.sort((a, b) => a.from - b.from || a.to - b.to);
    widgetDecorations.sort((a, b) => a.offset - b.offset);

    // Absolute character offset of the first character on the current line
    let lineStartOffset = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i]!;
      const lineNum = i + 1;
      const lineStart = lineStartOffset;
      const lineEnd = lineStart + lineText.length;

      // Reuse an existing line element when available, otherwise create a new one.
      let $block: HTMLElement;

      if (i < $lines.length) {
        $block = $lines[i]!;

        // Remove all attributes so stale class names, data-*, and title don't bleed through
        while ($block.attributes.length > 0) {
          $block.removeAttribute($block.attributes[0]!.name);
        }

        $block.className = 'line';

        // Clear children
        while ($block.firstChild) {
          $block.removeChild($block.firstChild);
        }
      } else {
        $block = RCBlockBlot.create() as HTMLElement;

        $documentRoot.appendChild($block);
      }

      // Apply line decorations
      const lineDecorations = lineDecorationsMap.get(lineNum) ?? [];

      for (const decoration of lineDecorations) {
        if (decoration.className) {
          for (const cls of decoration.className.split(/\s+/).filter(Boolean)) {
            $block.classList.add(cls);
          }
        }

        if (decoration.attributes) {
          for (const [attrName, attrValue] of Object.entries(decoration.attributes)) {
            $block.setAttribute(attrName, attrValue);
          }
        }
      }

      // Narrow decorations to those overlapping this line
      const marks = markDecorations.filter((d) => d.from < lineEnd && d.to > lineStart);
      const widgets = widgetDecorations.filter((d) => d.offset >= lineStart && d.offset <= lineEnd);

      buildLineContent($block, lineText, lineStart, marks, widgets);

      // Set diagnostic message via data attribute — rendered by ::after pseudo-element
      // so it is completely outside the DOM selection and clipboard path.
      const diagnostics = lineDecorations.filter((decoration) => decoration.message);

      if (diagnostics.length > 0) {
        const text = diagnostics.map((decoration) => decoration.message).join(' · ');
        const classes = [
          ...new Set(
            diagnostics.flatMap((decoration) =>
              decoration.messageClassName
                ? decoration.messageClassName.split(/\s+/).filter(Boolean)
                : [],
            ),
          ),
        ];

        $block.dataset.message = text;
        $block.title = text;

        if (classes.length > 0) {
          $block.dataset.messageClass = classes.join(' ');
        }
      }

      lineStartOffset += lineText.length + 1; // +1 for the '\n' separator
    }

    // Remove trailing line elements left over from a shorter previous value
    while ($documentRoot.children.length > lines.length) {
      $documentRoot.removeChild($documentRoot.lastChild!);
    }
  }

  destroy(): void {
    const $documentRoot = this.scroll.domNode as HTMLElement;

    while ($documentRoot.firstChild) {
      $documentRoot.removeChild($documentRoot.firstChild);
    }
  }
}

/**
 * Extracts plain text directly from the contenteditable DOM.
 */
export function getText($editorEl: HTMLElement): string {
  const $lines = Array.from($editorEl.querySelectorAll<HTMLElement>('.line'));

  if ($lines.length > 0) {
    return $lines.map(($lineEl) => getLineText($lineEl)).join('\n');
  }

  // Fallback: raw contenteditable DOM walk
  return extractRawText($editorEl);
}

function getLineText($lineEl: HTMLElement): string {
  let text = '';

  for (const node of $lineEl.childNodes) {
    text += getNodeText(node);
  }

  return text;
}

function getNodeText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node as Text).data;
  }

  if (!(node instanceof Element)) {
    return '';
  }

  if (node.classList.contains('widget')) {
    return '';
  }

  if (node.classList.contains('line-message')) {
    return '';
  }

  if (node.tagName === 'BR') {
    return '';
  }

  let text = '';

  for (const child of node.childNodes) {
    text += getNodeText(child);
  }

  return text;
}

function extractRawText($el: HTMLElement): string {
  let result = '';
  let firstBlock = true;

  for (const node of $el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += (node as Text).data;
    } else if (node instanceof HTMLElement) {
      if (node.tagName === 'BR') {
        result += '\n';
        firstBlock = false;
        continue;
      }

      if (node.classList.contains('widget')) {
        continue;
      }

      const isBlock = node.tagName === 'DIV' || node.tagName === 'P';

      if (isBlock && !firstBlock) {
        result += '\n';
      }

      firstBlock = false;
      result += extractRawText(node);
    }
  }

  return result;
}
