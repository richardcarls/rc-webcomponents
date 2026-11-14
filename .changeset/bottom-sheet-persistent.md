---
'@rcarls/rc-bottom-sheet': minor
'@rcarls/rc-dialog': patch
---

Add `persistent` to `rc-bottom-sheet` for a standard sheet that stays on screen. At its lowest snap point the sheet is collapsed and shown while its inner `<dialog>` stays closed, so it never captures Escape or the system back button. Above that point its `<dialog>` is open and non-modal, and a close request allowed by `closed-by` collapses the sheet instead of closing it, firing `rc-bottom-sheet-snap` with the new `close-request` trigger. `requestClose()` and a swipe dismiss collapse it too; `close()` or `open = false` hides it.
