---
'@rcarls/rc-virtual-canvas': patch
---

Map browser client coordinates to content CSS pixels independently of the canvas
backing-store resolution. Pointer coordinates no longer double under a 2x
backing store, and CSS zoom no longer changes the meaning of content positions.
`canvasScaleX` and `canvasScaleY` now report backing-store pixels per local CSS
pixel, so they remain accurate when an ancestor applies CSS zoom.
