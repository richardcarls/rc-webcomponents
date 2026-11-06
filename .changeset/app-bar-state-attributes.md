---
'@rcarls/rc-app-bar': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-tailwind': minor
---

**Breaking:** `rc-app-bar` no longer writes `data-scrolled`, `data-collapsed`, or
`data-hidden`. Select the existing `:state(scrolled)`, `:state(collapsed)`, and
`:state(hidden)` custom states instead.

Migration: replace `rc-app-bar[data-collapsed]` with
`rc-app-bar:state(collapsed)`, and likewise for the other two states.
