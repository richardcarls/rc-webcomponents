import type {
  Decoration,
  MarkDecoration,
  LineDecoration,
  DecorationInput,
} from './types.ts';
export { generateId } from './types.ts';

// ── Edit detection ────────────────────────────────────────────────────────────

/**
 * The minimal description of a single contiguous edit:
 * a deletion of `removed` characters at `start`, followed by an insertion of
 * `inserted` characters at that same position.
 */
interface Edit {
  /** Character offset where the edit begins (inclusive). */
  start: number;
  /** Number of characters removed. */
  removed: number;
  /** Number of characters inserted. */
  inserted: number;
}

/**
 * Find the single contiguous edit region that transforms `oldValue` into
 * `newValue` by trimming equal prefix and suffix.
 *
 * This is a heuristic ("longest common prefix/suffix"), not a full LCS diff.
 * It assumes the browser makes one contiguous edit per input event, which holds
 * true for normal typing, deletion, and paste.
 */
export function findEdit(oldValue: string, newValue: string): Edit {
  let start = 0;
  while (
    start < oldValue.length &&
    start < newValue.length &&
    oldValue[start] === newValue[start]
  ) {
    start++;
  }
  let oldEnd = oldValue.length;
  let newEnd = newValue.length;
  while (
    oldEnd > start &&
    newEnd > start &&
    oldValue[oldEnd - 1] === newValue[newEnd - 1]
  ) {
    oldEnd--;
    newEnd--;
  }
  return { start, removed: oldEnd - start, inserted: newEnd - start };
}

/**
 * Remap a `[from, to)` mark range through a single edit, returning the new
 * range or `null` if the decoration collapses to zero width and should be dropped.
 *
 * - Ranges entirely **before** the edit are unchanged.
 * - Ranges entirely **after** the edit are shifted by `edit.inserted − edit.removed`.
 * - Ranges that **overlap** the edit region are expanded/contracted to cover the
 *   nearest edit boundary, then dropped if they collapse.
 */
function remapMarkRange(
  from: number,
  to: number,
  edit: Edit,
): { from: number; to: number } | null {
  const editEnd = edit.start + edit.removed;
  const delta = edit.inserted - edit.removed;

  if (to <= edit.start) return { from, to };           // entirely before edit
  if (from >= editEnd) return { from: from + delta, to: to + delta }; // entirely after

  // Overlaps the edit region — clamp to nearest edit boundary
  const newFrom = Math.min(from, edit.start);
  const newTo = Math.max(
    to > editEnd ? to + delta : edit.start + edit.inserted,
    edit.start + edit.inserted,
  );
  if (newFrom >= newTo) return null;
  return { from: newFrom, to: newTo };
}

/**
 * Count the number of `\n` characters in `text` before `offset`.
 * Used to convert a character offset to a 1-based line number.
 */
function countNewlinesBefore(text: string, offset: number): number {
  let count = 0;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') count++;
  }
  return count;
}

/**
 * Remap all decorations in `decorations` from positions in `oldValue` to
 * positions in `newValue`, assuming a single contiguous edit.
 *
 * - `MarkDecoration`: remapped via `remapMarkRange`; dropped if collapsed.
 * - `LineDecoration`: dropped if its line falls within the deleted region;
 *   otherwise shifted by the line delta.
 * - `WidgetDecoration`: treated like a zero-width mark at its offset.
 *
 * Returns a new array. The input array and its elements are not mutated.
 */
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

  // 1-based line number of the first character that changed
  const editStartLine = countNewlinesBefore(oldValue, edit.start) + 1;
  const editEndLine = editStartLine + linesRemoved;

  const mapped: Decoration[] = [];

  for (const dec of decorations) {
    if (dec.type === 'mark') {
      const result = remapMarkRange(dec.from, dec.to, edit);
      if (result) mapped.push({ ...dec, from: result.from, to: result.to });
    } else if (dec.type === 'line') {
      if (dec.line < editStartLine) {
        mapped.push(dec);                                   // before edit — unchanged
      } else if (dec.line <= editEndLine) {
        // falls within deleted region — drop
      } else {
        mapped.push({ ...dec, line: dec.line + lineDelta }); // after edit — shift
      }
    } else {
      // WidgetDecoration: treat the offset like a mark's 'from'
      const result = remapMarkRange(dec.offset, dec.offset + 1, edit);
      if (result) mapped.push({ ...dec, offset: result.from });
    }
  }

  return mapped;
}

/**
 * Heuristic: returns `true` when an edit is large enough that remapping
 * decorations would likely produce incorrect results and it's better to
 * clear them entirely.
 *
 * Threshold: the change affects > 50 characters **and** > 50% of the document.
 * This covers paste of large blocks, select-all + type, and programmatic value
 * sets with substantially different content. It deliberately ignores inserts
 * into an empty document (no existing decorations to preserve).
 */
export function isLargeChange(oldValue: string, edit: Edit): boolean {
  if (oldValue.length === 0) return false;
  const changeSize = Math.max(edit.removed, edit.inserted);
  return changeSize > 50 && changeSize > oldValue.length * 0.5;
}

/**
 * Map decorations through a text change, or clear them entirely if the change
 * is classified as "large" (see `isLargeChange`).
 *
 * This is the primary entry point used by the component on each input event.
 */
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

/**
 * Add a single decoration to `map`, assigning it a fresh UUID as its `id`.
 * Returns the assigned ID.
 */
export function addDecoration(
  map: Map<string, Decoration>,
  input: DecorationInput,
): string {
  const id = crypto.randomUUID();
  map.set(id, { ...input, id } as Decoration);
  return id;
}

/**
 * Replace all decorations in `map` with a new set derived from `inputs`.
 * Each input is assigned a fresh UUID.
 */
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
