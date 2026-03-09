import type { RCTextareaPlugin, DecorationInput } from '@rcarls/rc-textarea';

interface ShikiToken {
  content: string;
  color?: string;
}

/** Minimal structural shape of a shiki `Highlighter`. */
interface ShikiHighlighter {
  codeToTokens(
    code: string,
    opts: { lang: string; theme?: string },
  ): Promise<{ tokens: ShikiToken[][] }>;
}

/**
 * Create an `rc-textarea` plugin that uses a [shiki](https://shiki.style/) `Highlighter`
 * to produce syntax decorations.
 *
 * Shiki tokens carry line-relative offsets; this adapter converts them to the absolute
 * character offsets that rc-textarea expects by tracking position across lines.
 *
 * ```ts
 * import { createHighlighter } from 'shiki';
 * import { createShikiPlugin } from '@rcarls/rc-textarea-adapters';
 *
 * const highlighter = await createHighlighter({
 *   themes: ['github-dark'],
 *   langs: ['typescript'],
 * });
 *
 * editor.usePlugin(createShikiPlugin(highlighter, 'typescript', 'github-dark'));
 * ```
 */
export function createShikiPlugin(
  highlighter: ShikiHighlighter,
  lang: string,
  theme?: string,
): RCTextareaPlugin {
  return {
    async update(value, api) {
      const result = await highlighter.codeToTokens(value, {
        lang,
        ...(theme ? { theme } : {}),
      });

      const decorations: DecorationInput[] = [];
      let offset = 0;

      for (const line of result.tokens) {
        for (const token of line) {
          const len = token.content.length;
          if (token.color) {
            decorations.push({
              type: 'mark',
              from: offset,
              to: offset + len,
              color: token.color,
            });
          }
          offset += len;
        }
        offset += 1; // '\n'
      }

      api.setDecorations(decorations);
    },
  };
}
