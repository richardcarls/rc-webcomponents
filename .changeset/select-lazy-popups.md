---
'@rcarls/rc-select': minor
'@rcarls/rc-combobox': minor
'@rcarls/rc-markdown-editor': patch
---

Load the select dialog popup and selected-value chips on first use.
`rc-select` and `rc-combobox` now import `rc-dialog` only for
`popup-mode="dialog"` and `rc-chip-group` only for `multiple`, so a popover
single select ships neither. The markdown editor toolbar picks the heading level
with a native `<select>`, styled by the existing
`--rc-markdown-editor-toolbar-select-*` properties, and no longer depends on
`rc-select`.

Breaking change and migration:

- Importing `@rcarls/rc-select/define` or `@rcarls/rc-combobox/define` no
  longer registers `rc-dialog`, `rc-chip-group`, or `rc-chip`. Import their own
  `define` entries where the page uses those elements directly.
