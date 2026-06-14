import type { TextPattern, MarkDecoration, LineDecoration } from './types.ts';

export type { TextPattern };

/**
 * Run all `patterns` against `value` and collect every match as decorations.
 *
 * For each pattern:
 * - If `captureGroups` is set, one `MarkDecoration` is emitted **per named
 *   capture group** instead of one for the whole match. Unmatched optional
 *   groups are silently skipped. The `d` flag (match indices) is added to
 *   the regex automatically.
 * - Otherwise, one `MarkDecoration` covering the entire match is emitted,
 *   using the styling fields copied directly from the pattern.
 * - If `createLineDecoration` is provided, it is called for every match
 *   (regardless of `captureGroups`) and may produce a paired `LineDecoration`.
 *
 * The global flag is added automatically if missing to ensure all occurrences
 * are found and to avoid stateful `lastIndex` bugs on the caller's regex.
 * Zero-length matches are skipped to prevent infinite loops.
 */
export function matchPatternResults(
  value: string,
  patterns: TextPattern[],
): { markDecorations: Omit<MarkDecoration, 'id'>[]; lineDecorations: Omit<LineDecoration, 'id'>[] } {
  const markDecorations: Omit<MarkDecoration, 'id'>[] = [];
  const lineDecorations: Omit<LineDecoration, 'id'>[] = [];

  for (const pattern of patterns) {
    // Always clone the regex with the global flag so we can iterate all
    // occurrences without mutating the caller's RegExp.lastIndex.
    // Add the 'd' flag (indices) automatically when captureGroups is set.
    let flags = pattern.pattern.flags.includes('g')
      ? pattern.pattern.flags
      : pattern.pattern.flags + 'g';
    if (pattern.captureGroups && !flags.includes('d')) {
      flags += 'd';
    }
    const regex = new RegExp(pattern.pattern.source, flags);

    let match: RegExpExecArray | null;
    while ((match = regex.exec(value)) !== null) {
      // Skip zero-length matches to guard against infinite loops
      if (match[0].length === 0) {
        regex.lastIndex++;
        continue;
      }

      const from = match.index;

      if (pattern.captureGroups) {
        // Per-group mode: emit one MarkDecoration per named capture group.
        // Unmatched optional groups (indices === undefined) are skipped.
        const groupIndices = match.indices?.groups;
        if (groupIndices) {
          for (const [groupName, style] of Object.entries(pattern.captureGroups)) {
            const range = groupIndices[groupName];
            if (range === undefined) continue;
            const [groupStart, groupEnd] = range;
            markDecorations.push({ type: 'mark', from: groupStart, to: groupEnd, ...style });
          }
        }
      } else {
        // Whole-match mode: one decoration covering the entire match.
        const to = from + match[0].length;
        markDecorations.push({
          type: 'mark',
          from,
          to,
          className: pattern.className,
          bold: pattern.bold,
          italic: pattern.italic,
          color: pattern.color,
          background: pattern.background,
          underline: pattern.underline,
          underlineColor: pattern.underlineColor,
          attributes: pattern.attributes,
        });
      }

      if (pattern.createLineDecoration) {
        const lineInput = pattern.createLineDecoration(match);
        if (lineInput) {
          const line = value.slice(0, from).split('\n').length; // 1-based line number
          lineDecorations.push({ type: 'line', line, ...lineInput });
        }
      }
    }
  }

  return { markDecorations, lineDecorations };
}
