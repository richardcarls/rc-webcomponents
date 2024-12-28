import type { Decoration, Diagnostic, MarkDecoration, LineDecoration } from './decoration.ts';

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

interface BoundaryEvent {
  pos: number;
  /** positive = open, negative = close */
  kind: 'open' | 'close';
  decoration: MarkDecoration;
}

function buildAttrs(dec: MarkDecoration): string {
  let attrs = '';
  if (dec.className) attrs += ` class="${escapeHtml(dec.className)}"`;
  if (dec.attributes) {
    for (const [k, v] of Object.entries(dec.attributes)) {
      attrs += ` ${escapeHtml(k)}="${escapeHtml(v)}"`;
    }
  }
  return attrs;
}

function renderLine(
  lineText: string,
  lineStart: number,
  markDecorations: MarkDecoration[],
): string {
  const lineEnd = lineStart + lineText.length;

  // Build boundary events for all marks that intersect this line
  const events: BoundaryEvent[] = [];
  for (const dec of markDecorations) {
    const from = Math.max(dec.range.from, lineStart);
    const to = Math.min(dec.range.to, lineEnd);
    if (from >= to) continue;
    events.push({ pos: from, kind: 'open', decoration: dec });
    events.push({ pos: to, kind: 'close', decoration: dec });
  }

  // Sort: by position, then closes before opens at the same position
  events.sort((a, b) => {
    if (a.pos !== b.pos) return a.pos - b.pos;
    // closes before opens at same position
    if (a.kind !== b.kind) return a.kind === 'close' ? -1 : 1;
    return 0;
  });

  let html = '';
  let cursor = lineStart; // absolute offset
  const openStack: MarkDecoration[] = [];

  function flushText(upTo: number) {
    if (upTo > cursor) {
      html += escapeHtml(lineText.slice(cursor - lineStart, upTo - lineStart));
      cursor = upTo;
    }
  }

  function openSpan(dec: MarkDecoration) {
    html += `<span${buildAttrs(dec)}>`;
  }

  function closeSpan(_dec: MarkDecoration) {
    html += '</span>';
  }

  for (const evt of events) {
    flushText(evt.pos);

    if (evt.kind === 'open') {
      openSpan(evt.decoration);
      openStack.push(evt.decoration);
    } else {
      // Close: pop from stack and emit closing tag
      const idx = openStack.lastIndexOf(evt.decoration);
      if (idx !== -1) {
        // Close all spans above and including this one, then reopen those above
        const toReopen = openStack.splice(idx + 1);
        openStack.splice(idx, 1);
        // Close from innermost outward
        for (let i = toReopen.length - 1; i >= 0; i--) {
          html += '</span>';
        }
        closeSpan(evt.decoration);
        // Reopen those that were above this one
        for (const dec of toReopen) {
          openSpan(dec);
        }
      }
    }
  }

  // Flush remaining text
  flushText(lineEnd);

  // Close any still-open spans
  for (let i = openStack.length - 1; i >= 0; i--) {
    html += '</span>';
  }

  return html;
}

export function renderMirror(
  value: string,
  decorations: Decoration[],
  diagnostics: Diagnostic[],
): string {
  const lines = value.split('\n');

  // Index mark decorations and line decorations by line for fast lookup
  const marksByLine = new Map<number, MarkDecoration[]>();
  const lineDecsByLine = new Map<number, LineDecoration[]>();

  let lineStart = 0;
  for (let i = 0; i < lines.length; i++) {
    const lineEnd = lineStart + lines[i].length;
    // Gather mark decorations intersecting this line
    const marks: MarkDecoration[] = [];
    for (const dec of decorations) {
      if (dec.type === 'mark') {
        if (dec.range.from < lineEnd && dec.range.to > lineStart) {
          marks.push(dec);
        }
      } else if (dec.type === 'line' && dec.line === i + 1) {
        if (!lineDecsByLine.has(i)) lineDecsByLine.set(i, []);
        lineDecsByLine.get(i)!.push(dec);
      }
    }
    if (marks.length > 0) marksByLine.set(i, marks);
    lineStart = lineEnd + 1; // +1 for '\n'
  }

  // Index diagnostics by 1-based line
  const diagsByLine = new Map<number, Diagnostic[]>();
  for (const diag of diagnostics) {
    if (!diagsByLine.has(diag.line)) diagsByLine.set(diag.line, []);
    diagsByLine.get(diag.line)!.push(diag);
  }

  let html = '';
  lineStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i];
    const lineNum = i + 1; // 1-based

    // Line wrapper classes + attributes from LineDecoration
    const lineDecList = lineDecsByLine.get(i) ?? [];
    const extraClasses = lineDecList.map((d) => d.className ?? '').filter(Boolean).join(' ');
    let lineAttrs = '';
    for (const ld of lineDecList) {
      if (ld.attributes) {
        for (const [k, v] of Object.entries(ld.attributes)) {
          lineAttrs += ` ${escapeHtml(k)}="${escapeHtml(v)}"`;
        }
      }
    }

    const className = ['line', extraClasses].filter(Boolean).join(' ');
    html += `<div class="${className}"${lineAttrs}>`;

    const marks = marksByLine.get(i) ?? [];
    const lineContent = renderLine(lineText, lineStart, marks);

    if (lineContent === '') {
      // Empty line — must have <br> to prevent collapse
      html += '<br>';
    } else {
      html += lineContent;
    }

    // Append Error Lens-style diagnostics inline after the line text
    const lineDiags = diagsByLine.get(lineNum) ?? [];
    for (const diag of lineDiags) {
      let iconHtml = '';
      if (diag.createIcon) {
        const iconEl = diag.createIcon();
        iconHtml = `<span class="diagnostic-icon" aria-hidden="true">${iconEl.outerHTML}</span>`;
      }
      html += `<span class="diagnostic diagnostic--${diag.severity}" aria-hidden="true">${iconHtml}${escapeHtml(diag.message)}</span>`;
    }

    html += '</div>';
    lineStart += lineText.length + 1; // +1 for '\n'
  }

  return html;
}

/**
 * Render gutter line numbers. When `lineHeights` is provided (word-wrap mode),
 * each number div gets an explicit height matching the corresponding mirror line
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
