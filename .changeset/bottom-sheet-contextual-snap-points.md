---
'@rcarls/rc-bottom-sheet': patch
---

Resolve `snap-points` inside the sheet when each snap applies. Entries may use `calc()` and
`var()`, including values with inner spaces, and custom properties inherited by the sheet are
read at their current value, so a page can drive a snap point from an animated property such
as a scroll-linked peek height.
