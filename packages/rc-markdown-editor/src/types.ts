/** Actions dispatched by `<rc-editor-toolbar>` via the `rc-toolbar-action` event. */
export type EditorToolbarAction =
  | 'bold'
  | 'italic'
  | 'code'
  | 'link'
  | 'heading'
  | 'source';

/** Detail payload carried by `rc-toolbar-action` custom events. */
export interface EditorToolbarActionDetail {
  action: EditorToolbarAction;
}

/** Heading level active at the current cursor position. */
export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

/** Inline and block formatting state at the current cursor position or selection. */
export interface ActiveFormats {
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  link?: boolean;
  heading?: HeadingLevel | null;
}

/** Editor display mode. */
export type EditorMode = 'rich' | 'source';

declare global {
  interface HTMLElementEventMap {
    'rc-toolbar-action':    CustomEvent<EditorToolbarActionDetail>;
    'rc-change':            CustomEvent<{ value: string }>;
    'rc-mode-change':       CustomEvent<{ mode: EditorMode }>;
    'rc-formatting-change': CustomEvent<ActiveFormats>;
  }
}
