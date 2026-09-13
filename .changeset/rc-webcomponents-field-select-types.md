---
'@rcarls/rc-webcomponents': patch
---

Fix the aggregate Solid JSX type declarations for `rc-field`, `rc-select`, and `rc-combobox`,
stale relative to their real current APIs: `RCFieldControl` was missing `select`; `RCSelectRef`
(and `RCComboboxRef` through it) predated a listbox option-type refactor and was missing
`required`, `focus()`, and `blur()`. Also adds the `data-rc-field-control` attribute to the
`rc-select`/`rc-combobox` intrinsic element types.
