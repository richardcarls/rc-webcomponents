---
'@rcarls/rc-adaptive-menu': minor
---

**Breaking:** `rc-adaptive-menu` replaces the `data-overflow` attribute with the
`:state(overflow)` custom state, set while at least one action is in the
overflow menu.

Migration: replace `rc-adaptive-menu[data-overflow]` with
`rc-adaptive-menu:state(overflow)`, and in scripts read
`menu.matches(':state(overflow)')`.
