import type { Diagnostic, MarkDecoration, LineDecoration, WidgetDecoration } from './decoration.ts';

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function buildAttrs(dec: MarkDecoration | WidgetDecoration): string {
  let attrs = '';
  if (dec.className) attrs += ` class="${escapeHtml(dec.className)}"`;
  if (dec.attributes) {
    for (const [k, v] of Object.entries(dec.attributes)) {
      attrs += ` ${escapeHtml(k)}="${escapeHtml(v)}"`;
    }
  }
  return attrs;
}

interface BoundaryEvent {
  pos: number;
  kind: 'open' | 'close' | 'widget';
  decoration: MarkDecoration | WidgetDecoration;
}

/**
 * Render the flat HTML for the contenteditable editing surface.
 *
 * Output is a plain stream of escaped text and `<span>` elements — no `.line`
 * wrapper divs. Newlines appear as literal `\n` characters in text nodes,
 * rendered as line breaks by the editor's `white-space: pre` (or `pre-wrap`)
 * CSS. This makes the structure compatible with syntax-highlighter output
 * (hljs, Prism, etc.) which also produces flat span streams.
 *
 * Inline decorations:
 *   - MarkDecoration  → `<span class="..." ...>text</span>`
 *   - WidgetDecoration → `<span contenteditable="false" data-widget-text="...">`
 */
export function renderEditor(
  value: string,
  decorations: Array<MarkDecoration | WidgetDecoration>,
): string {
  const events: BoundaryEvent[] = [];

  for (const dec of decorations) {
    if (dec.type === 'mark') {
      if (dec.range.from >= dec.range.to) continue;
      events.push({ pos: dec.range.from, kind: 'open', decoration: dec });
      events.push({ pos: dec.range.to, kind: 'close', decoration: dec });
    } else {
      if (dec.range.from >= dec.range.to) continue;
      events.push({ pos: dec.range.from, kind: 'widget', decoration: dec });
    }
  }

  // Sort: by position, then widget/close before open at same position
  events.sort((a, b) => {
    if (a.pos !== b.pos) return a.pos - b.pos;
    const order = (k: string) => (k === 'widget' ? 0 : k === 'close' ? 1 : 2);
    return order(a.kind) - order(b.kind);
  });

  let html = '';
  let cursor = 0;
  const openStack: MarkDecoration[] = [];

  function flushText(upTo: number) {
    if (upTo > cursor) {
      html += escapeHtml(value.slice(cursor, upTo));
      cursor = upTo;
    }
  }

  for (const evt of events) {
    flushText(evt.pos);

    if (evt.kind === 'open') {
      html += `<span${buildAttrs(evt.decoration as MarkDecoration)}>`;
      openStack.push(evt.decoration as MarkDecoration);
    } else if (evt.kind === 'close') {
      const dec = evt.decoration as MarkDecoration;
      const idx = openStack.lastIndexOf(dec);
      if (idx !== -1) {
        const toReopen = openStack.splice(idx + 1);
        openStack.splice(idx, 1);
        for (let i = toReopen.length - 1; i >= 0; i--) html += '</span>';
        html += '</span>';
        for (const d of toReopen) html += `<span${buildAttrs(d)}>`;
      }
    } else {
      // Widget: close any open marks, insert widget span, reopen marks
      const dec = evt.decoration as WidgetDecoration;
      const widgetEnd = dec.range.to;
      const widgetText = value.slice(evt.pos, widgetEnd);
      for (let i = openStack.length - 1; i >= 0; i--) html += '</span>';
      html += `<span contenteditable="false" data-widget-text="${escapeHtml(widgetText)}"${buildAttrs(dec)}>`;
      html += dec.createElement().outerHTML;
      html += '</span>';
      for (const d of openStack) html += `<span${buildAttrs(d)}>`;
      cursor = widgetEnd;
    }
  }

  flushText(value.length);
  for (let i = openStack.length - 1; i >= 0; i--) html += '</span>';

  return html;
}

/**
 * Render the absolutely-positioned line overlay HTML.
 *
 * One `.overlay-line` div per logical line. This element is placed behind the
 * contenteditable and carries:
 *   - Background colours from LineDecoration (e.g. `diagnostic-line--error`)
 *   - Error Lens-style inline diagnostic labels
 *
 * The overlay is kept out of the contenteditable DOM entirely so that:
 *   - Plugin HTML (hljs, Prism) flows into the editor unmodified
 *   - Selection and cursor preservation operate on clean text nodes only
 *   - `extractEditorText` never encounters diagnostic text
 */
export function renderLineOverlay(
  value: string,
  lineDecorations: LineDecoration[],
  diagnostics: Diagnostic[],
): string {
  const lines = value.split('\n');

  const lineDecsByLine = new Map<number, LineDecoration[]>();
  for (const dec of lineDecorations) {
    if (!lineDecsByLine.has(dec.line)) lineDecsByLine.set(dec.line, []);
    lineDecsByLine.get(dec.line)!.push(dec);
  }

  const diagsByLine = new Map<number, Diagnostic[]>();
  for (const diag of diagnostics) {
    if (!diagsByLine.has(diag.line)) diagsByLine.set(diag.line, []);
    diagsByLine.get(diag.line)!.push(diag);
  }

  let html = '';
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const lineDecList = lineDecsByLine.get(lineNum) ?? [];
    const extraClasses = lineDecList
      .map((d) => d.className ?? '')
      .filter(Boolean)
      .join(' ');
    let lineAttrs = '';
    for (const ld of lineDecList) {
      if (ld.attributes) {
        for (const [k, v] of Object.entries(ld.attributes)) {
          lineAttrs += ` ${escapeHtml(k)}="${escapeHtml(v)}"`;
        }
      }
    }

    const className = ['overlay-line', extraClasses].filter(Boolean).join(' ');
    html += `<div class="${className}"${lineAttrs}>`;

    const lineDiags = diagsByLine.get(lineNum) ?? [];
    for (const diag of lineDiags) {
      let iconHtml = '';
      if (diag.createIcon) {
        const iconEl = diag.createIcon();
        iconHtml = `<span class="diagnostic-icon">${iconEl.outerHTML}</span>`;
      }
      html += `<span class="diagnostic diagnostic--${diag.severity}">${iconHtml}${escapeHtml(diag.message)}</span>`;
    }

    html += '</div>';
  }

  return html;
}

/**
 * Render gutter line numbers. When `lineHeights` is provided (word-wrap mode),
 * each number div gets an explicit height matching the corresponding editor line
 * so that line numbers stay vertically aligned with wrapped content.
 */
export function renderGutter(lineCount: number, lineHeights?: number[]): string {
  let html = '';
  for (let i = 1; i <= lineCount; i++) {
    const h = lineHeights?.[i - 1];
    const style = h != null && h > 0 ? ` style="height:${h}px"` : '';
    html += `<div class="line-number"${style}>${i}</div>`;
  }
  return html;
}

/**
 * Extract the plain-text value from the contenteditable editor DOM.
 *
 * Works with both our own `renderEditor` output and flat plugin HTML (hljs,
 * Prism, etc.). Collects:
 *   - Text node content verbatim (including `\n` line-break characters)
 *   - Widget span text via `data-widget-text`
 * Skips any `contenteditable="false"` element that is NOT a widget span
 * (defensive, in case external code inserts non-editable nodes).
 */
export function extractEditorText(editor: HTMLElement): string {
  return extractNodeText(editor);
}

function extractNodeText(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node as Text).data;
  }
  if (node instanceof Element) {
    // <br> elements represent a newline in the plain-text model.  Browsers
    // occasionally insert them in contenteditable (e.g. during paste or IME)
    // even in white-space:pre mode; treating them as '\n' keeps the value
    // consistent with what the user sees.
    if ((node as Element).tagName === 'BR') return '\n';
    if (node.getAttribute('contenteditable') === 'false') {
      const el = node as HTMLElement;
      return el.dataset.widgetText !== undefined ? el.dataset.widgetText : '';
    }
    let text = '';
    for (const child of node.childNodes) {
      text += extractNodeText(child);
    }
    return text;
  }
  return '';
}
