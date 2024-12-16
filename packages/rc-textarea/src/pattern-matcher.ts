import type { MarkDecoration } from './decoration.ts';

export interface TextPattern {
  id: string;
  pattern: RegExp;
  className?: string;
  attributes?: Record<string, string>;
  createWidget?: (match: RegExpMatchArray) => HTMLElement | null;
  widgetPlacement?: 'before' | 'after' | 'replace';
}

export function matchPatterns(
  value: string,
  patterns: TextPattern[],
): MarkDecoration[] {
  const result: MarkDecoration[] = [];

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
      const capturedMatch = match;

      result.push({
        id: `pattern:${pattern.id}:${from}:${to}`,
        type: 'mark',
        range: { from, to },
        className: pattern.className,
        attributes: pattern.attributes,
        createWidget: pattern.createWidget
          ? () => pattern.createWidget!(capturedMatch) ?? document.createElement('span')
          : undefined,
        widgetPlacement: pattern.widgetPlacement,
      });
    }
  }

  return result;
}
