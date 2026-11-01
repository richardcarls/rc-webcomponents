---
'@rcarls/rc-dialog': minor
'@rcarls/rc-bottom-sheet': minor
'@rcarls/rc-markdown-editor': minor
'@rcarls/rc-common': patch
---

`rc-dialog` and `rc-bottom-sheet` now extend Lit's `ReactiveElement` instead of
`LitElement`. They rendered nothing, but Lit still kept a marker comment in the
author's markup, and a DOM morph that removed it made the next update throw.
`rc-editor-toolbar` now renders into a shadow root instead of its light DOM, so
it hydrates from server-rendered markup and survives a morph.

`rc-bottom-sheet` keeps its `closed-by="any"` and `resize="vertical"` defaults
off the host like other reflected defaults, and `ResizeController` from
`rc-common` puts its injected resize grip back after a morph removes it. The
toolbar's heading select now renders the active level with the `selected`
attribute, which a server render serializes correctly.

Breaking changes:

- A subclass of `RCDialog` or `RCBottomSheet` can no longer return a template
  from `render()`. Render inside the author's `<dialog>` instead.
- Selectors that reached into `rc-editor-toolbar`, such as
  `rc-editor-toolbar rc-button`, no longer match. Use the
  `--rc-markdown-editor-toolbar-*` custom properties, which inherit into the
  toolbar.
