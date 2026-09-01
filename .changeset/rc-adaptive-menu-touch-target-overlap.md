---
'@rcarls/rc-adaptive-menu': minor
---

Add `--rc-adaptive-menu-touch-target-overlap-inline-start` and
`-inline-end`, zero by default. A theme or consumer sets one to let the
overflow trigger's accessible touch-target inflation on that side overlap
into whatever sits just outside the host, such as a toolbar's own edge
padding, instead of also reserving layout space there (the overflow
trigger is conventionally the trailing-most control in a toolbar, so
`-inline-end` is the one commonly set). Mirrors `@rcarls/rc-button`'s and
`@rcarls/rc-menu-button`'s own touch-target overlap tokens.
