---
'@rcarls/rc-segmented-button': minor
---

Fix two spacing bugs in the optional selected-icon (checkmark) pattern:
`--rc-segmented-button-segment-gap` had no fallback value, so there was no
gap at all between the checkmark and the label text; and the checkmark
slot was `display: none` when unchecked (zero width, zero gap consumed),
so a segment's width visibly grew when it became selected.

The selected-icon slot now always reserves its width (new
`--rc-segmented-button-selected-icon-size`, default `1.25em`), toggling
only `visibility` between checked/unchecked states, with a matching
pure-CSS mirror spacer on the opposite side (RTL-safe via logical
`inline-size`) so the label text stays centered instead of leaning toward
the now-always-reserved leading icon slot. Segment width is now constant
regardless of selection state. `--rc-segmented-button-segment-gap`
defaults to `0.5em`. Both changes are backward compatible for consumers
not using the selected-icon slot at all.
