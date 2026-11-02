---
'@rcarls/rc-dialog': patch
'@rcarls/rc-bottom-sheet': patch
'@rcarls/rc-webcomponents': patch
---

`move-bounds="parent"` now keeps a dialog inside the element that contains `<rc-dialog>`. It
measured the inline `<rc-dialog>` element itself, whose box is empty, so moving or resizing
pushed the dialog outside its container. The bounds apply to both moving and resizing.
