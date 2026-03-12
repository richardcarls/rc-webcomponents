/** Actions dispatched by `<rc-editor-toolbar>` via the `rc-toolbar-action` event. */
export type EditorToolbarAction =
  | 'bold'
  | 'italic'
  | 'code'
  | 'link'
  | 'heading'
  | 'preview';

/** Detail payload carried by `rc-toolbar-action` custom events. */
export interface EditorToolbarActionDetail {
  action: EditorToolbarAction;
}

declare global {
  interface HTMLElementEventMap {
    'rc-toolbar-action': CustomEvent<EditorToolbarActionDetail>;
    'rc-preview-change': CustomEvent<{ preview: boolean }>;
  }
}
