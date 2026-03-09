import type { RCTextareaPlugin, MarkDecoration, DecorationInput } from '@rcarls/rc-textarea';

/** Minimal structural shape of a lezer `Parser` / language's `.parser`. */
interface LezerParser {
  parse(input: string): {
    cursor(): LezerCursor;
  };
}

interface LezerCursor {
  type: { name: string };
  from: number;
  to: number;
  next(): boolean;
}

/**
 * Create an `rc-textarea` plugin that uses a lezer parser (e.g. any `@codemirror/lang-*` package)
 * to produce syntax decorations.
 *
 * Lezer node offsets (`.from` / `.to`) are already absolute character offsets, identical to
 * rc-textarea's coordinate space — no conversion is needed.
 *
 * ```ts
 * import { javascript } from '@codemirror/lang-javascript';
 * import { createLezerPlugin } from '@rcarls/rc-textarea-adapters';
 *
 * editor.usePlugin(createLezerPlugin(javascript().language.parser, {
 *   VariableDeclaration: { color: 'var(--color-keyword)' },
 *   String:              { color: 'var(--color-string)' },
 *   LineComment:         { italic: true, color: 'var(--color-comment)' },
 * }));
 * ```
 */
export function createLezerPlugin(
  parser: LezerParser,
  nodeTypeToStyle: Record<string, Omit<MarkDecoration, 'id' | 'type' | 'from' | 'to'>>,
): RCTextareaPlugin {
  return {
    update(value, api) {
      const tree = parser.parse(value);
      const cursor = tree.cursor();
      const decorations: DecorationInput[] = [];
      do {
        const style = nodeTypeToStyle[cursor.type.name];
        if (style) {
          decorations.push({ type: 'mark', from: cursor.from, to: cursor.to, ...style });
        }
      } while (cursor.next());
      api.setDecorations(decorations);
    },
  };
}
