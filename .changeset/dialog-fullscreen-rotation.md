---
'@rcarls/rc-dialog': patch
---

Cap a fullscreen dialog's tracked size at the viewport, so a size left
over from before a rotation can't overflow the page. On Firefox for
Android that overflow widened the layout viewport and left the page
zoomed in after the dialog closed.
