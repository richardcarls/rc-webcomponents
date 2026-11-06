---
'@rcarls/rc-list': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-tailwind': minor
'@rcarls/rc-theme-win31': minor
---

**Breaking:** the `data-rc-list-leading` and `data-rc-list-supporting` markers
are removed. Themes style a direct `<small>` as supporting text, and give
standard icon geometry to an `<svg>` or `[data-rc-icon]` element in the
`leading` slot.

Migration: write supporting text as `<small>`, and replace
`data-rc-list-leading` on an icon-font element with `data-rc-icon`.
