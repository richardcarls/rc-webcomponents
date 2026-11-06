---
'@rcarls/rc-list': minor
'@rcarls/rc-theme-material': minor
---

**Breaking:** `rc-list` replaces `data-reordering` with `:state(reordering)`.
Its items replace `data-dragging` with `:state(dragging)`, and
`data-rc-list-position` with one of `:state(first)`, `:state(middle)`,
`:state(last)`, or `:state(only)`.

Migration: replace `rc-list-item[data-rc-list-position='last']` with
`rc-list-item:state(last)`, and `rc-list-item[data-dragging]` with
`rc-list-item:state(dragging)`.
