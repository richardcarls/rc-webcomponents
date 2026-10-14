---
'@rcarls/rc-dialog': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-webcomponents': minor
---

`rc-dialog` gains `variant="side"`, a modal side sheet. The surface docks to the inline end at
full block size, pads every edge for the physical safe-area insets, and rounds only its start
corners. Like the fullscreen variant, it never moves or resizes. Theme it with
`--rc-dialog-side-inline-size`, `--rc-dialog-side-background`, `--rc-dialog-side-radius`, and
`--rc-dialog-side-shadow`. A landscape phone can now show a sheet's content beside the page
instead of in a bottom sheet that leaves only a strip of content visible.

A theme or consumer can now set a standard dialog's preferred width through
`--rc-dialog-inline-size`, which defaults to `fit-content`. Set it to `100%` for a dialog with
fluid content, such as a search field or a list, which otherwise shrinks to its minimum width.

The Material theme maps the side sheet to Material 3: `surface-container-low`, large leading
corners, and level 1 elevation. Its design guide documents side sheets, task dialog sizing, and
full-screen dialogs when the window is compact in either dimension. The React and Solid typings
accept the new variant.
