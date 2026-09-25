---
'@rcarls/rc-list': patch
---

Place rows by `aria-posinset` and `aria-setsize` when they carry them, so a
virtualized list rendering only a slice gives first- and last-row styling to
the set's real ends instead of the ends of the slice.
