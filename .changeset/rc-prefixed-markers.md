---
'@rcarls/rc-adaptive-menu': minor
'@rcarls/rc-carousel': minor
'@rcarls/rc-combobox': minor
'@rcarls/rc-common': minor
'@rcarls/rc-listbox': minor
'@rcarls/rc-menu': minor
'@rcarls/rc-select': minor
'@rcarls/rc-transfer-list': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-tailwind': minor
'@rcarls/rc-theme-win31': minor
---

**Breaking:** markers that land in light DOM carry the `data-rc-` prefix.
`rc-adaptive-menu` reads `data-rc-action-priority` instead of `data-priority`.
Active menu, listbox, and option rows carry `data-rc-active` instead of
`data-active`. Carousel loop clones carry `data-rc-clone` instead of
`data-clone`.

Migration: rename `data-priority` on adaptive menu actions to
`data-rc-action-priority`, and update selectors for `[data-active]` and
`[data-clone]`.
