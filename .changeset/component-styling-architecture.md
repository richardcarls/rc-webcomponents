---
'@rcarls/rc-app-bar': minor
'@rcarls/rc-chip': minor
'@rcarls/rc-chip-group': minor
'@rcarls/rc-combobox': minor
'@rcarls/rc-fab-menu': minor
'@rcarls/rc-field': minor
'@rcarls/rc-markdown-editor': minor
'@rcarls/rc-search-bar': minor
'@rcarls/rc-select': minor
'@rcarls/rc-textarea': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-transfer-list': minor
---

Standardize component styling contracts for the breaking 0.7 release.

BREAKING CHANGE: Rename the Markdown editor's `--rme-*` properties to
`--rc-markdown-editor-*`, `--rc-app-bar-background` to `--rc-app-bar-bg`,
`--rc-textarea-radius` to `--rc-textarea-border-radius`, the transfer-list
`--rc-transfer-list-panel-*` properties to `--rc-transfer-list-listbox-*`,
`--rc-chip-group-webkit-scrollbar-display` to
`--rc-chip-group-scrollbar-display`, and `--rc-text` to `--rc-field-text`.
Compatibility aliases are intentionally not provided.

BREAKING CHANGE: Replace `--rc-select-chip-padding-inline` and
`--rc-combobox-chip-padding-inline` with explicit `*-padding-inline-start` and
`*-padding-inline-end` tokens. Generated removable chips now reserve the full
remove target and its edge offset, so their indicator cannot overlap label text.

Add canonical app-bar elevation, transfer-list listbox radius, and textarea
line-action tokens. Make `rc-field` consume the shared semantic token layer,
and place the `rc-chip` and `rc-search-bar` light-DOM structural styles in the
`rc-base` cascade layer so normal consumer rules override them.

Remove unused Material navigation-rail toggle tokens and obsolete list-item
theme tokens. Register the segmented-button private theme seam and enforce
token ownership, documentation, removed-name, selector-budget, and cascade
layer contracts through the component architecture audit.
