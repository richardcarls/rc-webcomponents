---
'@rcarls/rc-theme-material': patch
'@rcarls/rc-theme-win31': patch
---

Icon slots keep their square while empty. An SVG icon element such as
`<iconify-icon>` draws a frame after it mounts, so swapping one in, such as a
filter chip's check, no longer collapses the slot and shifts the row for a
frame. Icon-font glyphs already fill 1em and render the same.
