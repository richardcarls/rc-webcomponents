import type { Decoration, Diagnostic } from './decoration.ts';
import type { RCTextarea } from './rc-textarea.ts';

/**
 * Contextual API passed to plugin lifecycle callbacks.
 * Provides access to the host element, the contenteditable editor div, and
 * rendering utilities.
 */
export interface RCTextareaPluginAPI {
  /** The host rc-textarea element. */
  readonly host: RCTextarea;
  /**
   * The contenteditable editor div. Set `editor.innerHTML` directly for full
   * rendering control. Call `scheduleUpdate()` after any direct DOM mutation
   * so that the gutter and ARIA live region stay in sync.
   *
   * When setting innerHTML, structure content as flat `.line` divs (one per
   * logical line) so that:
   *   - The line-number gutter aligns correctly in word-wrap mode.
   *   - Diagnostics added via `addDiagnostic()` render inline after line text.
   *   - The cursor can be restored correctly across re-renders.
   */
  readonly editor: HTMLDivElement;
  /**
   * All active diagnostics — both user-added (via `addDiagnostic`) and
   * pattern-generated (via `addPattern` with `createDiagnostic`).
   */
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  /**
   * User-added mark/line/widget decorations plus pattern-matched decorations.
   * Does not include decorations derived internally from diagnostics.
   */
  readonly decorations: ReadonlyArray<Decoration>;
  /**
   * HTML-escape a string for safe inline insertion into the editor.
   * Always escape raw user text before placing it in the returned HTML.
   */
  escapeHtml(text: string): string;
  /**
   * Render editor HTML using the standard pipeline (patterns + decorations + diagnostics).
   * Returns the HTML that would be placed in the editor without a plugin active.
   * Useful for post-processing — e.g. apply syntax highlighting to the default output,
   * or keep the standard rendering while modifying a small part of it.
   */
  renderDefault(value: string): string;
  /**
   * Schedule a re-render outside of normal text input events.
   * Call this when plugin state changes independently of the editor content,
   * for example when the language changes, a theme is applied, or an async
   * parse completes after returning `null` from a previous `highlight()` call.
   */
  scheduleUpdate(): void;
}

/**
 * A plugin that takes over editor rendering for rc-textarea.
 *
 * Register a plugin with `element.usePlugin(plugin)`. Only one plugin can be
 * active at a time; registering a new one replaces the existing plugin.
 *
 * @example Syntax highlighting with highlight.js
 * ```ts
 * import hljs from 'highlight.js';
 * textarea.usePlugin({
 *   highlight: (value) => hljs.highlight(value, { language: 'javascript' }).value,
 * });
 * ```
 *
 * @example Syntax highlighting with Prism
 * ```ts
 * import Prism from 'prismjs';
 * textarea.usePlugin({
 *   highlight: (value) =>
 *     Prism.highlight(value, Prism.languages.javascript, 'javascript'),
 * });
 * ```
 *
 * @example Async highlight (WASM / web worker)
 * ```ts
 * textarea.usePlugin({
 *   async highlight(value) {
 *     return await myWasmParser.highlight(value);
 *   },
 * });
 * ```
 *
 * @example Post-process the default output (preserves diagnostics/decorations)
 * ```ts
 * textarea.usePlugin({
 *   highlight: (value, api) => myTransform(api.renderDefault(value)),
 * });
 * ```
 */
export interface RCTextareaPlugin {
  /**
   * Called when the plugin is registered with an element.
   * Use this to store the `api` reference and set up any external resources.
   */
  mount?(api: RCTextareaPluginAPI): void;
  /**
   * Called when the plugin is removed (via `removePlugin()`) or when the
   * rc-textarea element disconnects from the DOM. Clean up workers, timers,
   * and event listeners here.
   */
  destroy?(): void;
  /**
   * Transform the editor value into HTML for the contenteditable surface.
   *
   * Return an HTML string to use as `editor.innerHTML`, replacing the default
   * rendering. Return `null`, `undefined`, or `void` to fall through to the
   * standard pipeline (patterns + decorations + diagnostics).
   *
   * Async return values are fully supported. If a newer render cycle starts
   * before the promise resolves, the stale result is automatically discarded.
   *
   * Note: Structure content as flat `.line` divs (one per logical line).
   * If your plugin HTML does not preserve this structure, the line-number
   * gutter will not align correctly in word-wrap mode, and diagnostics added
   * via `addDiagnostic()` will not be rendered inline.
   * Use `api.renderDefault()` as a base if you need those features.
   */
  highlight(
    value: string,
    api: RCTextareaPluginAPI,
  ): string | null | undefined | void | Promise<string | null | undefined | void>;
}
