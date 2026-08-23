---
'@rcarls/rc-common': patch
---

Fix `ItemsCollectionController` (used by `rc-listbox`, and transitively by
`rc-select` and `rc-combobox`) toggling an option on the first touch contact
instead of letting a scrollable options list scroll. Touch activation now
waits for `pointerup` within a 10px tap threshold; a larger move cancels the
pending activation. Mouse and pen still activate on `pointerdown`.
