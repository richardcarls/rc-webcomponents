import type { Decoration, MarkDecoration, LineDecoration, DecorationInput } from './types.ts';
export { generateId } from './types.ts';

// ── Edit detection ────────────────────────────────────────────────────────────

interface Edit {
  start: number;
  removed: number;
  inserted: number;
}

export function findEdit(oldVal: string, newVal: string): Edit {
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
  from: number,
  to: number,
  edit: Edit,
): { from: number; to: number } | null {
  const editEnd = edit.start + edit.removed;
  const delta = edit.inserted - edit.removed;

  if (to <= edit.start) return { from, to };
  if (from >= editEnd) return { from: from + delta, to: to + delta };

  const newFrom = Math.min(from, edit.start);
  const newTo = Math.max(
    to > editEnd ? to + delta : edit.start + edit.inserted,
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
  oldValue: string,
  newValue: string,
): Decoration[] {
  const edit = findEdit(oldValue, newValue);
  const editEnd = edit.start + edit.removed;

  const removedText = oldValue.slice(edit.start, editEnd);
  const insertedText = newValue.slice(edit.start, edit.start + edit.inserted);
  const linesRemoved = (removedText.match(/\n/g) ?? []).length;
  const linesInserted = (insertedText.match(/\n/g) ?? []).length;
  const lineDelta = linesInserted - linesRemoved;

  const editStartLine = countNewlinesBefore(oldValue, edit.start) + 1;
  const editEndLine = editStartLine + linesRemoved;

  const mapped: Decoration[] = [];

  for (const dec of decorations) {
    if (dec.type === 'mark') {
      const result = mapMarkRange(dec.from, dec.to, edit);
      if (result) mapped.push({ ...dec, from: result.from, to: result.to });
    } else if (dec.type === 'line') {
      if (dec.line < editStartLine) {
        mapped.push(dec);
      } else if (dec.line <= editEndLine) {
        // Within removed region — drop
      } else {
        mapped.push({ ...dec, line: dec.line + lineDelta });
      }
    } else {
      // WidgetDecoration — treat offset like a mark's 'from'
      const result = mapMarkRange(dec.offset, dec.offset + 1, edit);
      if (result) mapped.push({ ...dec, offset: result.from });
    }
  }

  return mapped;
}

/**
 * Heuristic: is this edit a "large change" (e.g. paste, select-all+type)?
 * If so, decorations should be cleared rather than mapped through an invalid diff.
 */
export function isLargeChange(oldValue: string, edit: Edit): boolean {
  const changeSize = Math.max(edit.removed, edit.inserted);
  return changeSize > 50 && changeSize > oldValue.length * 0.5;
}

export function mapOrClear(
  decorations: Decoration[],
  oldValue: string,
  newValue: string,
): Decoration[] {
  const edit = findEdit(oldValue, newValue);
  if (isLargeChange(oldValue, edit)) return [];
  return mapDecorationsThroughChange(decorations, oldValue, newValue);
}

// ── Decoration ID management ──────────────────────────────────────────────────

export function addDecoration(
  map: Map<string, Decoration>,
  input: DecorationInput,
): string {
  const id = crypto.randomUUID();
  map.set(id, { ...input, id } as Decoration);
  return id;
}

export function setDecorations(
  map: Map<string, Decoration>,
  inputs: DecorationInput[],
): void {
  map.clear();
  for (const input of inputs) {
    const id = crypto.randomUUID();
    map.set(id, { ...input, id } as Decoration);
  }
}

// Type helpers for extracting subtypes from Decoration union
export type { MarkDecoration, LineDecoration };
