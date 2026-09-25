---
'@rcarls/rc-fab': minor
'@rcarls/rc-fab-menu': minor
'@rcarls/rc-webcomponents': patch
---

Name the `position` corners for what they already do: each pins to a
logical block and inline edge, so they turn with the writing mode.

**Breaking:** the `position` values are renamed. Migrate:

- `bottom-end` → `block-end-inline-end` (the default)
- `bottom-start` → `block-end-inline-start`
- `top-end` → `block-start-inline-end`
- `top-start` → `block-start-inline-start`
