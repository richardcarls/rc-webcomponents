# @rcarls/rc-transfer-list

Side-by-side transfer list web component built from rc-listbox.

## Styling Hooks

Panels expose `data-empty` when their backing list has no options and
`data-has-selection` when that panel currently has highlighted rows. The root
exposes `data-can-move-up` and `data-can-move-down` when the selected panel has
highlighted rows that can be reordered in that direction.
