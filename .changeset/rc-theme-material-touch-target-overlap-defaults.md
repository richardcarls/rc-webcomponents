---
'@rcarls/rc-theme-material': minor
---

Default the new touch-target overlap tokens for MD3's own dense/narrow
icon-button and overflow-trigger conventions: `rc-button`'s and
`rc-menu-button`'s narrow variant (where the icon is smaller than the
default 3rem touch target) now reclaim the trailing edge automatically,
and `rc-adaptive-menu`'s overflow trigger, always the trailing-most
control in its toolbar by design, does the same unconditionally. Only the
trailing edge defaults, matching each component's own documented
"trailing overflow trigger" use case; the leading edge stays an explicit
opt-in.
