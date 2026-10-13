---
'@rcarls/rc-app-bar': minor
'@rcarls/rc-theme-material': patch
'@rcarls/rc-webcomponents': minor
---

With `scroll-behavior="hide"`, `rc-app-bar` now publishes read-only geometry onto its scroll
target: `--rc-app-bar-block-size`, its measured block size, and
`--rc-app-bar-visible-block-size`, the same value or `0px` while hidden. Hiding only translates
the bar, so a layout can now give its space back: stack the bar over the scroll container,
reserve the block size as the container's block-start padding and scroll padding, and pin
sticky content at the visible size minus the block size, since sticky offsets are measured
inside that padding. The bar removes both values when it stops hiding, changes
target, or disconnects.

The Material design guide documents this recipe and the compact-height patterns for landscape
phones: app bars that hide on scroll, side sheets instead of modal bottom sheets, full-screen
task dialogs, media capped by the pane's height, and single-row sticky chips.
