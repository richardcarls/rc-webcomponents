---
'@rcarls/rc-combobox': patch
---

Fix the toggle button's size custom property so it is `--rc-combobox-toggle-size`, matching
every other `--rc-combobox-*` token in the package. It previously reused rc-select's
`--rc-select-toggle-indicator-size`, so setting `--rc-combobox-toggle-size` on `<rc-combobox>`
silently did nothing.
