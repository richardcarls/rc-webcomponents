// ── Decoration types ─────────────────────────────────────────────────────────

/**
 * A styled inline range over characters [from, to).
 * Rich formatting properties (bold, italic, color, etc.) are rendered as
 * inline styles on the blot span; `className` adds an extra CSS class.
 */
export interface MarkDecoration {
  id: string;
  type: 'mark';
  /** Inclusive start offset (0-based character index into plain text). */
  from: number;
  /** Exclusive end offset. */
  to: number;
  className?: string;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  background?: string;
  underline?: 'solid' | 'wavy' | 'dotted' | 'dashed';
  underlineColor?: string;
  attributes?: Record<string, string>;
}

/**
 * A decoration applied to an entire logical line.
 * Adds a CSS class and/or data attributes to the line div, and optionally
 * appends an error-lens style annotation message at the end of the line.
 */
export interface LineDecoration {
  id: string;
  type: 'line';
  /** 1-based logical line number. */
  line: number;
  className?: string;
  /**
   * Error-lens style annotation text shown at the end of the line.
   * Rendered as an aria-hidden span after all line content.
   */
  message?: string;
  messageClassName?: string;
  attributes?: Record<string, string>;
}

/**
 * A non-editable DOM element inserted at a character offset.
 * Widgets are purely visual and do not appear in the plain text value.
 */
export interface WidgetDecoration {
  id: string;
  type: 'widget';
  /** Character offset. Widget is placed before (or after) the character at this position. */
  offset: number;
  /** Factory called each render cycle. Must return a new element each time. */
  create(): HTMLElement;
  /** Whether to place the widget before or after the character at `offset`. Default: 'before'. */
  side?: 'before' | 'after';
}

export type Decoration = MarkDecoration | LineDecoration | WidgetDecoration;
export type DecorationInput =
  | Omit<MarkDecoration, 'id'>
  | Omit<LineDecoration, 'id'>
  | Omit<WidgetDecoration, 'id'>;

// ── Plugin types ─────────────────────────────────────────────────────────────

/**
 * Contextual API available inside plugin lifecycle callbacks.
 *
 * Plugins own the decoration state — keep a reference to `api` from `mount()`
 * to set decorations from outside the plugin lifecycle:
 *
 * ```ts
 * let api: RCTextareaV2PluginAPI;
 * editor.usePlugin({
 *   mount(a) { api = a; },
 *   update() {},
 * });
 * // later:
 * api.setDecorations([...]);
 * api.scheduleUpdate();
 * ```
 */
export interface RCTextareaV2PluginAPI {
  /** The host rc-textarea-v2 element. */
  readonly host: HTMLElement;
  readonly value: string;

  addDecoration(d: DecorationInput): string;
  removeDecoration(id: string): void;
  clearDecorations(): void;
  setDecorations(decorations: DecorationInput[]): void;

  /** Trigger a render pass outside of normal text input events. */
  scheduleUpdate(): void;

  /**
   * Compatibility bridge for highlight.js / prism.js.
   *
   * Parses an HTML string of `<span class="...">text</span>` structures
   * (as returned by `hljs.highlight()` or `Prism.highlight()`) and converts
   * them into `MarkDecoration` objects covering the corresponding character
   * ranges of the plain text value.
   *
   * ```ts
   * editor.usePlugin({
   *   highlight(value, api) {
   *     const html = hljs.highlight(value, { language: 'js' }).value;
   *     api.setDecorations(api.decorationsFromHtml(html));
   *   },
   * });
   * ```
   */
  decorationsFromHtml(html: string): Omit<MarkDecoration, 'id'>[];
}

/**
 * Plugin interface for rc-textarea-v2.
 *
 * At least one of `update` or `highlight` must be provided.
 *
 * @example Syntax highlighting with highlight.js
 * ```ts
 * import hljs from 'highlight.js/lib/core';
 * import javascript from 'highlight.js/lib/languages/javascript';
 * hljs.registerLanguage('javascript', javascript);
 *
 * editor.usePlugin({
 *   highlight(value, api) {
 *     const html = hljs.highlight(value, { language: 'javascript' }).value;
 *     api.setDecorations(api.decorationsFromHtml(html));
 *   },
 * });
 * ```
 *
 * @example Async highlighter (WASM / web worker)
 * ```ts
 * editor.usePlugin({
 *   async update(value, api) {
 *     const decs = await myParser.decorate(value);
 *     api.setDecorations(decs);
 *   },
 * });
 * ```
 */
export interface RCTextareaV2Plugin {
  /** Called when the plugin is registered. Store `api` here for external use. */
  mount?(api: RCTextareaV2PluginAPI): void;
  /** Called when the plugin is replaced or the element disconnects. */
  destroy?(): void;
  /**
   * Imperative decoration API — called on each value change.
   * Use `api.setDecorations()` to apply decorations.
   */
  update?(value: string, api: RCTextareaV2PluginAPI): void | Promise<void>;
  /**
   * HTML-based compat — called on each value change.
   * Return an HTML string (e.g. from hljs/prism); it will be parsed via
   * `api.decorationsFromHtml()` and applied as mark decorations.
   * Return `null` or `void` to skip.
   */
  highlight?(
    value: string,
    api: RCTextareaV2PluginAPI,
  ): string | null | void | Promise<string | null | void>;
}

// ── Pattern types ─────────────────────────────────────────────────────────────

export interface TextPattern {
  id: string;
  pattern: RegExp;
  className?: string;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  background?: string;
  underline?: 'solid' | 'wavy' | 'dotted' | 'dashed';
  underlineColor?: string;
  attributes?: Record<string, string>;
  /**
   * Factory called for each regex match. Return a partial LineDecoration
   * (message, messageClassName, className, attributes) to add an error-lens
   * annotation on the matched line, or `null` to skip.
   */
  createLineDecoration?: (match: RegExpMatchArray) =>
    | Omit<LineDecoration, 'id' | 'type' | 'line'>
    | null;
}

export function generateId(): string {
  return crypto.randomUUID();
}
