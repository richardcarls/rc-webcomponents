---
'@rcarls/rc-common': patch
'@rcarls/rc-dialog': patch
'@rcarls/rc-bottom-sheet': patch
---

Dialogs, sheets, and their drag and resize gestures now keep their geometry under an
ancestor's CSS `zoom`, such as an app-wide interface size set on the root. Measured boxes and
pointer positions are viewport pixels, while a length written to an element's style is zoomed
again, so a full-screen dialog fell short of or overflowed the viewport, a dragged bottom sheet
lifted off its docked edge, and each snap shrank or grew the sheet. Positions and sizes are now
converted to the element's own pixels through a new `cssZoom()` helper in `@rcarls/rc-common`.
`rc-bottom-sheet-snap` reports `height` in the sheet's own pixels, the unit of its snap points.
