---
'@rcarls/rc-dialog': minor
'@rcarls/rc-bottom-sheet': minor
'@rcarls/rc-select': patch
'@rcarls/rc-combobox': patch
'@rcarls/rc-markdown-editor': patch
'@rcarls/rc-webcomponents': minor
---

Load dialog move and resize behavior on demand. `rc-dialog` now imports its
drag and resize controllers only the first time `movable`, `move-handle`, or
`resize` enables them, so dialogs that never move or resize, including the
popups inside `rc-select`, `rc-combobox`, and `rc-markdown-editor`, no longer
ship that code. The new `@rcarls/rc-dialog/geometry` entry exports
`DialogGeometry` for subclasses that always resize; `rc-bottom-sheet` uses it,
so its resize stays available immediately.

Breaking changes and migration:

- `rc-dialog` and `rc-bottom-sheet` remove `light-dismiss` / `lightDismiss`.
  Use `closed-by="any"`, which closes on Escape or a backdrop click and now
  falls back to a backdrop click listener where the browser has no native
  `closedby`.
- `rc-bottom-sheet` now defaults `closed-by` to `any` instead of defaulting
  `light-dismiss` to true. Set `closed-by="closerequest"` to keep backdrop
  clicks from closing a sheet, or `closed-by="none"` to allow only explicit
  actions.
