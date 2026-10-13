---
'@rcarls/rc-dialog': patch
'@rcarls/rc-bottom-sheet': patch
---

A non-modal dialog or sheet that is already open when it connects, through `open` or
`default-open`, no longer takes focus from the page: native `show()` focuses the first control,
so a standard bottom sheet rendered open with a page stole focus as soon as its content existed.
Opening one later with `show()` still moves focus into it.
