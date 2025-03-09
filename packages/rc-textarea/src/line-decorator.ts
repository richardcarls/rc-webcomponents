import type {
  DecorationInput,
  LineDecoratorPlugin,
  MarkDecoration,
  RCTextareaPlugin,
} from './types.ts';

/**
 * Options for `createLineDecoratorPlugin`.
 */
export interface LineDecoratorPluginOptions {
  /**
   * An array of subscriber setup functions. Each function receives a callback
   * and should call it whenever an external value changes (e.g. a reactive
   * signal). It may return an optional cleanup/unsubscribe function called on
   * plugin destroy.
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
   * Use this to merge in decorations that require the full document value
   * (e.g. diagnostics from a whole-document parser).
   */
  extraDecorations?: (value: string) => DecorationInput[];
}

/**
 * Factory that wraps a `LineDecoratorPlugin` in a full `RCTextareaPlugin`.
 *
 * Handles the boilerplate that every per-line decorator needs:
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
    mount(a) {
      if (decorator.styles) a.adoptStyleSheet(decorator.styles);
      for (const subscribe of options.watch ?? []) {
        const cleanup = subscribe(() => a.scheduleUpdate());
        if (cleanup) cleanups.push(cleanup);
      }
    },

    destroy() {
      for (const cleanup of cleanups) cleanup();
      cleanups.length = 0;
    },

    update(value, a) {
      const lines = value.split('\n');
      const allDecorations: DecorationInput[] = [];
      let lineStart = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const d of decorator.decorateLine(line, i)) {
          if (d.type === 'mark') {
            // Convert line-relative offsets to absolute document offsets
            allDecorations.push({
              ...(d as Omit<MarkDecoration, 'id'>),
              from: lineStart + d.from,
              to: lineStart + d.to,
            });
          } else {
            // LineDecoration already uses 1-based line numbers — pass through
            allDecorations.push(d);
          }
        }
        lineStart += line.length + 1; // +1 for the '\n'
      }

      if (options.extraDecorations) {
        allDecorations.push(...options.extraDecorations(value));
      }

      a.setDecorations(allDecorations);
    },
  };
}
