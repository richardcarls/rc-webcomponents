---
'@rcarls/rc-dialog': patch
'@rcarls/rc-bottom-sheet': patch
---

`rc-dialog` keeps focus where it was when a non-modal open moves focus
into the dialog. An expanding persistent `rc-bottom-sheet`, which reopens
its `<dialog>` natively, no longer drops focus from its handle to the page,
so the next key press keeps stepping through the snap points.
