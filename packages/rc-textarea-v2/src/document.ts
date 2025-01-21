/**
 * V2Document — manages the Parchment-backed contenteditable editor DOM.
 *
 * Maintains a V2ScrollBlot as document root (wrapping the #editor div).
 * build() tears down the current tree and reconstructs it from plain text +
 * a flat array of decorations. DOM is built directly using the blots'
 * static create() methods for efficiency.
 */
import {
  V2ScrollBlot,
  V2BlockBlot,
  V2InlineBlot,
  V2WidgetBlot,
  createRegistry,
} from './blots.ts';
import type {
  Decoration,
  MarkDecoration,
  LineDecoration,
  WidgetDecoration,
} from './types.ts';

// ── Inline content builder ───────────────────────────────────────────────────

/**
 * Builds the child DOM of a line element given the line text, absolute line
 * start offset, and all decorations that affect this line.
 */
function buildLineContent(
  lineEl: HTMLElement,
  lineText: string,
  lineStart: number,
  markDecorations: MarkDecoration[],
  widgetDecorations: WidgetDecoration[],
): void {
  if (lineText.length === 0) {
    // Empty line needs a <br> so contenteditable allows cursor placement
    lineEl.appendChild(document.createElement('br'));
    return;
  }

  // Collect segment boundary points from all mark decoration edges
  const boundarySet = new Set<number>([0, lineText.length]);
  for (const dec of markDecorations) {
    boundarySet.add(Math.max(0, dec.from - lineStart));
    boundarySet.add(Math.min(lineText.length, dec.to - lineStart));
  }
  for (const dec of widgetDecorations) {
    const localOffset = dec.offset - lineStart;
    if (localOffset >= 0 && localOffset <= lineText.length) {
      boundarySet.add(localOffset);
    }
  }

  const boundaries = [...boundarySet].sort((a, b) => a - b);

  for (let i = 0; i < boundaries.length - 1; i++) {
    const segStart = boundaries[i]!;
    const segEnd = boundaries[i + 1]!;

    // Insert widgets whose position falls at segStart ('before' side)
    for (const w of widgetDecorations) {
      const localOffset = w.offset - lineStart;
      if (localOffset === segStart && (w.side ?? 'before') === 'before') {
        lineEl.appendChild(createWidgetEl(w));
      }
    }

    const segText = lineText.slice(segStart, segEnd);
    if (!segText) continue;

    // Find the innermost (smallest) mark decoration fully covering [segStart, segEnd)
    let bestDec: MarkDecoration | undefined;
    let bestSize = Infinity;
    for (const dec of markDecorations) {
      const localFrom = dec.from - lineStart;
      const localTo = dec.to - lineStart;
      if (localFrom <= segStart && localTo >= segEnd) {
        const size = localTo - localFrom;
        if (size < bestSize) {
          bestSize = size;
          bestDec = dec;
        }
      }
    }

    if (bestDec) {
      const spanEl = V2InlineBlot.create(bestDec) as HTMLSpanElement;
      if (bestDec.attributes) {
        for (const [k, v] of Object.entries(bestDec.attributes)) {
          spanEl.setAttribute(k, v);
        }
      }
      spanEl.appendChild(document.createTextNode(segText));
      lineEl.appendChild(spanEl);
    } else {
      lineEl.appendChild(document.createTextNode(segText));
    }

    // Insert 'after' widgets at segEnd
    for (const w of widgetDecorations) {
      const localOffset = w.offset - lineStart;
      if (localOffset === segEnd && w.side === 'after') {
        lineEl.appendChild(createWidgetEl(w));
      }
    }
  }

  // Widgets at very end of line (default 'before' side)
  for (const w of widgetDecorations) {
    const localOffset = w.offset - lineStart;
    if (localOffset === lineText.length && (w.side ?? 'before') === 'before') {
      lineEl.appendChild(createWidgetEl(w));
    }
  }
}

function createWidgetEl(dec: WidgetDecoration): HTMLSpanElement {
  const spanEl = V2WidgetBlot.create() as HTMLSpanElement;
  spanEl.appendChild(dec.create());
  return spanEl;
}

// ── V2Document ───────────────────────────────────────────────────────────────

export class V2Document {
  private readonly scroll: V2ScrollBlot;

  constructor(editorEl: HTMLDivElement) {
    const registry = createRegistry();
    this.scroll = new V2ScrollBlot(registry, editorEl);
  }

  /**
   * Full rebuild of the document tree from `value` + `decorations`.
   * Tears down all existing children before reconstructing.
   */
  build(value: string, decorations: Decoration[]): void {
    const editorEl = this.scroll.domNode as HTMLElement;

    // Clear existing DOM children
    while (editorEl.firstChild) {
      editorEl.removeChild(editorEl.firstChild);
    }

    const lines = value.split('\n');

    // Index decorations by type
    const lineDecMap = new Map<number, LineDecoration[]>();
    const markDecs: MarkDecoration[] = [];
    const widgetDecs: WidgetDecoration[] = [];

    for (const dec of decorations) {
      if (dec.type === 'line') {
        const arr = lineDecMap.get(dec.line) ?? [];
        arr.push(dec);
        lineDecMap.set(dec.line, arr);
      } else if (dec.type === 'mark') {
        markDecs.push(dec);
      } else {
        widgetDecs.push(dec);
      }
    }

    markDecs.sort((a, b) => a.from - b.from || a.to - b.to);
    widgetDecs.sort((a, b) => a.offset - b.offset);

    let charOffset = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i]!;
      const lineNum = i + 1;
      const lineStart = charOffset;
      const lineEnd = lineStart + lineText.length;

      // Create block element via Parchment's static create()
      const blockDomNode = V2BlockBlot.create() as HTMLElement;

      // Apply line decorations
      const lineDecs = lineDecMap.get(lineNum) ?? [];
      for (const ld of lineDecs) {
        if (ld.className) {
          for (const cls of ld.className.split(/\s+/).filter(Boolean)) {
            blockDomNode.classList.add(cls);
          }
        }
        if (ld.attributes) {
          for (const [k, v] of Object.entries(ld.attributes)) {
            blockDomNode.setAttribute(k, v);
          }
        }
      }

      // Narrow decorations to those overlapping this line
      const lineMarkDecs = markDecs.filter(d => d.from < lineEnd && d.to > lineStart);
      const lineWidgetDecs = widgetDecs.filter(
        d => d.offset >= lineStart && d.offset <= lineEnd,
      );

      buildLineContent(blockDomNode, lineText, lineStart, lineMarkDecs, lineWidgetDecs);

      // Set error-lens message via data attribute — rendered by ::after pseudo-element
      // so it is completely outside the DOM selection and clipboard path.
      const msgLineDecs = lineDecs.filter(ld => ld.message);
      if (msgLineDecs.length > 0) {
        const text = '\u00a0\u00a0' + msgLineDecs.map(ld => ld.message).join(' \u00b7 ');
        blockDomNode.dataset.message = text;
        const classes = [
          ...new Set(
            msgLineDecs.flatMap(ld =>
              ld.messageClassName ? ld.messageClassName.split(/\s+/).filter(Boolean) : [],
            ),
          ),
        ];
        if (classes.length > 0) blockDomNode.dataset.messageClass = classes.join(' ');
      }

      editorEl.appendChild(blockDomNode);
      charOffset += lineText.length + 1; // +1 for \n separator
    }
  }

  destroy(): void {
    const editorEl = this.scroll.domNode as HTMLElement;
    while (editorEl.firstChild) {
      editorEl.removeChild(editorEl.firstChild);
    }
  }
}

// ── Plain text extraction ─────────────────────────────────────────────────────

/**
 * Extracts plain text directly from the editor's contenteditable DOM.
 * Handles our structured .v2-line divs as well as browser-inserted markup
 * from edits that happen between render frames.
 */
export function extractEditorText(editorEl: HTMLElement): string {
  const lines = Array.from(editorEl.querySelectorAll<HTMLElement>('.v2-line'));
  if (lines.length > 0) {
    return lines.map(lineEl => getLineText(lineEl)).join('\n');
  }
  // Fallback: raw contenteditable DOM walk
  return extractRawText(editorEl);
}

function getLineText(lineEl: HTMLElement): string {
  let text = '';
  for (const node of lineEl.childNodes) text += getNodeText(node);
  return text;
}

function getNodeText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return (node as Text).data;
  if (!(node instanceof Element)) return '';
  if (node.classList.contains('v2-widget')) return '';
  if (node.classList.contains('v2-line-message')) return '';
  if (node.tagName === 'BR') return '';
  let text = '';
  for (const child of node.childNodes) text += getNodeText(child);
  return text;
}

function extractRawText(el: HTMLElement): string {
  let result = '';
  let firstBlock = true;

  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += (node as Text).data;
    } else if (node instanceof HTMLElement) {
      if (node.tagName === 'BR') {
        result += '\n';
        firstBlock = false;
        continue;
      }
      if (node.classList.contains('v2-widget')) continue;

      const isBlock = node.tagName === 'DIV' || node.tagName === 'P';
      if (isBlock && !firstBlock) result += '\n';
      firstBlock = false;
      result += extractRawText(node);
    }
  }

  return result;
}
