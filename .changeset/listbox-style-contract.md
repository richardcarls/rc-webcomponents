---
"@rcarls/rc-listbox": minor
"@rcarls/rc-select": minor
"@rcarls/rc-combobox": minor
"@rcarls/rc-transfer-list": minor
"@rcarls/rc-theme-material": minor
---

Normalize listbox option styling around the `--rc-listbox-*` CSS custom property contract.

`rc-listbox` now owns the structural option row styles in an injected `rc-base` cascade layer,
while select, combobox, transfer-list, and Material theme entrypoints configure embedded
listboxes by setting inherited listbox variables on the internal listbox host.
