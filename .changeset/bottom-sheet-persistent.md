---
'@rcarls/rc-bottom-sheet': minor
'@rcarls/rc-dialog': patch
---

Add `persistent` to `rc-bottom-sheet` for a standard sheet that stays on screen. At its lowest snap point the sheet is collapsed and shown while its inner `<dialog>` stays closed, so it never captures Escape or the system back button. Above that point its `<dialog>` is open and non-modal, and a close request allowed by `closed-by` collapses the sheet instead of closing it, firing `rc-bottom-sheet-snap` with the new `close-request` trigger. `requestClose()` and a swipe dismiss collapse it too, after a cancelable `rc-dialog-request-close`; `close()` or `open = false` hides it, as does a close request on a sheet without `snap-points`.

`rc-dialog` now moves an open dialog to the mode its settings call for when `modal` or `closed-by` changes, including between modal and non-modal, without firing close or toggle events.
