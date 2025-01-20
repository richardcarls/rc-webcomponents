import type { TextPattern, MarkDecoration, LineDecoration } from './types.ts';

export type { TextPattern };

export function matchPatternResults(
  value: string,
  patterns: TextPattern[],
): { markDecorations: Omit<MarkDecoration, 'id'>[]; lineDecorations: Omit<LineDecoration, 'id'>[] } {
  const markDecorations: Omit<MarkDecoration, 'id'>[] = [];
  const lineDecorations: Omit<LineDecoration, 'id'>[] = [];

  for (const pattern of patterns) {
    // Always clone with the global flag to avoid stateful lastIndex issues
    const flags = pattern.pattern.flags.includes('g')
      ? pattern.pattern.flags
      : pattern.pattern.flags + 'g';
    const re = new RegExp(pattern.pattern.source, flags);

    let match: RegExpExecArray | null;
    while ((match = re.exec(value)) !== null) {
      // Guard against infinite loop on zero-length matches
      if (match[0].length === 0) {
        re.lastIndex++;
        continue;
      }

      const from = match.index;
      const to = match.index + match[0].length;

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

      if (pattern.createLineDecoration) {
        const lineInput = pattern.createLineDecoration(match);
        if (lineInput) {
          const line = value.slice(0, from).split('\n').length; // 1-based
          lineDecorations.push({ type: 'line', line, ...lineInput });
        }
      }
    }
  }

  return { markDecorations, lineDecorations };
}
