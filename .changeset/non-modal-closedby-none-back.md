---
'@rcarls/rc-dialog': patch
'@rcarls/rc-bottom-sheet': patch
---

Open a non-modal `closed-by="none"` dialog or sheet without the native `<dialog>` open state. The component shows the closed `<dialog>` with inline styles instead, so the inner `<dialog>` has no `[open]` attribute; style the open surface through the host's `[open]`. Firefox for Android sends the system back button to any open `<dialog>`, even one that cannot close, which left the page unable to go back while a persistent sheet was showing.
