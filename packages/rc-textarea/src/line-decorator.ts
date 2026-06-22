import type {
  DecorationInput,
  LineDecoratorPlugin,
  MarkDecoration,
  RCTextareaPlugin,
} from './types.ts';

export interface LineDecoratorPluginOptions {
  /**
   * An array of subscriber setup functions for (e.g., reactive
   * signals).
   *
   * Each function receives a callback and should call it whenever an external
   * value changes . It may return an optional cleanup/unsubscribe function
   * called on plugin destroy.
   *
   * This is intentionally framework-agnostic. For Solid.js signals:
   * ```ts
   * watch: [
   *   (cb) => createEffect(on(mySignal, cb, { defer: true })),
   * ]
   * ```
   */
  watch?: Array<(onChange: () => void) => (() => void) | void>;

  /**
   * Called once per update pass **after** all per-line decorations are built.
   *
   * Use this to merge in decorations that require the full document value
   * (e.g., diagnostics from a whole-document parser).
   */
  extraDecorations?: (value: string) => DecorationInput[];
}

/**
 * Factory that wraps a `LineDecoratorPlugin` in a full `RCTextareaPlugin`.
 *
 * Handles the boilerplate that every per-line decorator needs:
 *
 * - CSS injection via `api.adoptStyleSheet` on mount
 * - `lineStart` offset bookkeeping when converting line-relative offsets to
 *   absolute document offsets
 * - Subscribing to external change signals and calling `api.scheduleUpdate()`
 * - Cleanup of subscribers on destroy
 *
 * @example
 * ```ts
 * const plugin = createLineDecoratorPlugin(
 *   {
 *     styles: '.kw { font-weight: bold; }',
 *     decorateLine(line) {
 *       const results: ReturnType<LineDecoratorPlugin['decorateLine']> = [];
 *       for (const m of line.matchAll(/\bfunction\b/g)) {
 *         results.push({ type: 'mark', from: m.index!, to: m.index! + m[0].length, className: 'kw' });
 *       }
 *       return results;
 *     },
 *   },
 *   {
 *     extraDecorations: (value) => getDiagnosticDecorations(value),
 *   },
 * );
 * editor.usePlugin(plugin);
 * ```
 */
export function createLineDecoratorPlugin(
  decorator: LineDecoratorPlugin,
  options: LineDecoratorPluginOptions = {},
): RCTextareaPlugin {
  const cleanups: (() => void)[] = [];

  return {
    mount(api) {
      if (decorator.styles) {
        api.adoptStyleSheet(decorator.styles);
      }

      for (const subscribe of options.watch ?? []) {
        const cleanup = subscribe(() => api.scheduleUpdate());

        if (cleanup) {
          cleanups.push(cleanup);
        }
      }
    },

    destroy() {
      for (const cleanup of cleanups) cleanup();

      cleanups.length = 0;
    },

    update(value, api) {
      const lines = value.split('\n');
      const decorations: DecorationInput[] = [];

      let lineStart = 0;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const decoration of decorator.decorateLine(line, i)) {
          if (decoration.type === 'mark') {
            // Convert line-relative offsets to absolute document offsets
            decorations.push({
              ...(decoration as Omit<MarkDecoration, 'id'>),
              from: lineStart + decoration.from,
              to: lineStart + decoration.to,
            });
          } else {
            // LineDecoration already uses 1-based line numbers — pass through
            decorations.push(decoration);
          }
        }

        // +1 for the '\n'
        lineStart += line.length + 1;
      }

      if (options.extraDecorations) {
        decorations.push(...options.extraDecorations(value));
      }

      api.setDecorations(decorations);
    },
  };
}
