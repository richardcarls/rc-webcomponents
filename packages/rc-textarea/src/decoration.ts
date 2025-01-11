export interface TextRange {
  from: number;
  to: number;
}

export interface MarkDecoration {
  id: string;
  type: 'mark';
  range: TextRange;
  className?: string;
  attributes?: Record<string, string>;
}

export interface LineDecoration {
  id: string;
  type: 'line';
  /** 1-based logical line number */
  line: number;
  className?: string;
  attributes?: Record<string, string>;
}

export interface WidgetDecoration {
  id: string;
  type: 'widget';
  /** Character range in the plain-text value that this widget replaces. */
  range: TextRange;
  /**
   * Factory that returns the HTMLElement to display inside the widget span.
   * Called once per render; the element's `outerHTML` is injected into the
   * contenteditable surface inside a `contenteditable="false"` wrapper span.
   */
  createElement: () => HTMLElement;
  className?: string;
  attributes?: Record<string, string>;
}

export type Decoration = MarkDecoration | LineDecoration | WidgetDecoration;

export interface Diagnostic {
  id: string;
  /** 1-based logical line number */
  line: number;
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  /** Optional factory for a leading icon element (e.g. SVG). */
  createIcon?: () => HTMLElement;
  /**
   * Character range for an automatic mark decoration (e.g. wavy underline).
   * When present, the component creates an internal MarkDecoration covering
   * this range styled with `markClassName` (or the built-in default class).
   */
  range?: TextRange;
  /**
   * CSS class for the auto-generated mark span.
   * Defaults to `diagnostic-mark diagnostic-mark--{severity}`, which uses the
   * built-in wavy-underline style driven by `--rc-textarea-mark-{severity}-color`.
   */
  markClassName?: string;
  /**
   * CSS class for an auto-generated line decoration.
   * When set, the whole `.line` div receives this class.
   * Use `diagnostic-line--{severity}` for the built-in tinted background.
   */
  lineClassName?: string;
}

/**
 * Input type for addDecoration / setDecorations — the discriminated union
 * of each decoration type without the auto-generated `id` field.
 */
export type DecorationInput =
  | Omit<MarkDecoration, 'id'>
  | Omit<LineDecoration, 'id'>
  | Omit<WidgetDecoration, 'id'>;

export function generateId(): string {
  return crypto.randomUUID();
}

interface Edit {
  start: number;
  removed: number;
  inserted: number;
}

function findEdit(oldVal: string, newVal: string): Edit {
  let start = 0;
  while (
    start < oldVal.length &&
    start < newVal.length &&
    oldVal[start] === newVal[start]
  ) {
    start++;
  }
  let oldEnd = oldVal.length;
  let newEnd = newVal.length;
  while (
    oldEnd > start &&
    newEnd > start &&
    oldVal[oldEnd - 1] === newVal[newEnd - 1]
  ) {
    oldEnd--;
    newEnd--;
  }
  return { start, removed: oldEnd - start, inserted: newEnd - start };
}

function mapMarkRange(
  range: TextRange,
  edit: Edit,
): TextRange | null {
  const editEnd = edit.start + edit.removed;
  const delta = edit.inserted - edit.removed;

  if (range.to <= edit.start) {
    // Entirely before the edit — unchanged
    return range;
  }
  if (range.from >= editEnd) {
    // Entirely after the edit — shift
    return { from: range.from + delta, to: range.to + delta };
  }
  // Overlapping — clamp to edit boundaries
  const newFrom = Math.min(range.from, edit.start);
  const newTo = Math.max(
    range.to > editEnd ? range.to + delta : edit.start + edit.inserted,
    edit.start + edit.inserted,
  );
  if (newFrom >= newTo) return null;
  return { from: newFrom, to: newTo };
}

function countNewlinesBefore(text: string, offset: number): number {
  let count = 0;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') count++;
  }
  return count;
}

export function mapDecorationsThroughChange(
  decorations: Decoration[],
  diagnostics: Diagnostic[],
  oldValue: string,
  newValue: string,
): { decorations: Decoration[]; diagnostics: Diagnostic[] } {
  const edit = findEdit(oldValue, newValue);
  const editEnd = edit.start + edit.removed;

  // Count newlines in removed and inserted regions to compute line delta
  const removedText = oldValue.slice(edit.start, editEnd);
  const insertedText = newValue.slice(edit.start, edit.start + edit.inserted);
  const linesRemoved = (removedText.match(/\n/g) ?? []).length;
  const linesInserted = (insertedText.match(/\n/g) ?? []).length;
  const lineDelta = linesInserted - linesRemoved;

  // 1-based line number of the edit start
  const editStartLine = countNewlinesBefore(oldValue, edit.start) + 1;
  // Last 1-based line covered by the removed region
  const editEndLine = editStartLine + linesRemoved;

  const mappedDecorations: Decoration[] = [];
  for (const dec of decorations) {
    if (dec.type === 'mark' || dec.type === 'widget') {
      const newRange = mapMarkRange(dec.range, edit);
      if (newRange !== null) {
        mappedDecorations.push({ ...dec, range: newRange });
      }
    } else {
      // LineDecoration
      if (dec.line < editStartLine) {
        // Before the edit — unchanged
        mappedDecorations.push(dec);
      } else if (dec.line <= editEndLine) {
        // Within the removed region — drop it
      } else {
        // After the removed region — shift by line delta
        mappedDecorations.push({ ...dec, line: dec.line + lineDelta });
      }
    }
  }

  const mappedDiagnostics: Diagnostic[] = [];
  for (const diag of diagnostics) {
    let mappedLine: number;
    if (diag.line < editStartLine) {
      mappedLine = diag.line;
    } else if (diag.line <= editEndLine) {
      // Within removed region — drop entirely
      continue;
    } else {
      mappedLine = diag.line + lineDelta;
    }

    // Also map the optional range through the edit
    let mappedRange: TextRange | undefined;
    if (diag.range) {
      const newRange = mapMarkRange(diag.range, edit);
      mappedRange = newRange ?? undefined; // edit overlapped range → clear mark, keep message
    }

    mappedDiagnostics.push({ ...diag, line: mappedLine, range: mappedRange });
  }

  return { decorations: mappedDecorations, diagnostics: mappedDiagnostics };
}

/**
 * Heuristic: is this edit a "large change" (e.g. paste, select-all+type)?
 * If so, decorations should be cleared rather than mapped through an invalid diff.
 *
 * A change qualifies when the larger of removed/inserted exceeds 50 chars AND
 * exceeds half the previous document length. This catches both "select-all + type"
 * (large removal) and "paste into short document" (large insertion).
 */
export function isLargeChange(oldValue: string, edit: Edit): boolean {
  const changeSize = Math.max(edit.removed, edit.inserted);
  return changeSize > 50 && changeSize > oldValue.length * 0.5;
}

export { findEdit };
