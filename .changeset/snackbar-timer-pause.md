---
'@rcarls/rc-snackbar': patch
'@rcarls/rc-webcomponents': patch
---

`rc-snackbar`'s auto-close timer now pauses while the pointer is over the snackbar or focus is
inside it, and resumes with the time that was left, so people can reach the action before the
message closes.
