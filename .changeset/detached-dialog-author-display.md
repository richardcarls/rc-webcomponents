---
'@rcarls/rc-dialog': patch
'@rcarls/rc-bottom-sheet': patch
---

Show a detached dialog (non-modal with `closed-by="none"`, or a collapsed
`persistent` sheet) through a new `:state(detached)` host state instead of
inline styles, so a `display` the consumer sets on the inner `<dialog>`, such
as `grid`, still applies.
