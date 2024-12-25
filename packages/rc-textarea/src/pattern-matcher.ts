import { generateId, type Diagnostic, type MarkDecoration } from './decoration.ts';

export interface TextPattern {
  id: string;
  pattern: RegExp;
  className?: string;
  attributes?: Record<string, string>;
  createWidget?: (match: RegExpMatchArray) => HTMLElement | null;
  widgetPlacement?: 'before' | 'after';
  /**
   * CSS text adopted into the shadow root as a dedicated CSSStyleSheet for
   * this pattern. Removed automatically when the pattern is removed.
   */
  cssText?: string;
  /**
   * Factory called for each regex match. Return a partial Diagnostic
   * (severity + message, optionally markClassName / lineClassName / createIcon).
   * The component automatically sets `id`, `line` (from match position in the
   * text), and `range` (the match bounds). Both a mark decoration (from
   * `className`) and a diagnostic can be produced by the same match.
   */
  createDiagnostic?: (match: RegExpMatchArray) => {
    severity: 'error' | 'warning' | 'info' | 'hint';
    message: string;
    createIcon?: () => HTMLElement;
    markClassName?: string;
    lineClassName?: string;
  } | null;
}

export function matchPatternResults(
  value: string,
  patterns: TextPattern[],
): { decorations: MarkDecoration[]; diagnostics: Diagnostic[] } {
  const decorations: MarkDecoration[] = [];
  const diagnostics: Diagnostic[] = [];

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

      // Mark decoration for the pattern's visual style
      decorations.push({
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

      // Optional diagnostic produced by this match
      if (pattern.createDiagnostic) {
        const diagInput = pattern.createDiagnostic(capturedMatch);
        if (diagInput) {
          const line = value.slice(0, from).split('\n').length; // 1-based
          diagnostics.push({
            id: generateId(),
            line,
            range: { from, to },
            ...diagInput,
          });
        }
      }
    }
  }

  return { decorations, diagnostics };
}
