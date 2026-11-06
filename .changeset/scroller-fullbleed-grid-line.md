---
'@rcarls/rc-scroller': minor
---

**Breaking:** `data-rc-scroller-span` is removed. In content layout, place a
direct child on the named `fullbleed` grid line instead.

Migration: replace `data-rc-scroller-span="fullbleed"` with a page rule such as
`rc-scroller > .fullbleed { grid-column: fullbleed; }`.
