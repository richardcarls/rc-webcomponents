---
'@rcarls/rc-dialog': patch
'@rcarls/rc-bottom-sheet': patch
---

Read an ancestor CSS zoom from the inner `<dialog>` rather than the host, so a
host styled `display: contents`, which reports no zoom, still covers the
viewport as a fullscreen dialog and resolves percentage snap points
correctly under an app-wide interface size.
