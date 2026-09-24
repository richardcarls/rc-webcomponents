---
'@rcarls/rc-common': minor
'@rcarls/rc-menu-button': minor
'@rcarls/rc-adaptive-menu': patch
'@rcarls/rc-webcomponents': patch
---

Anchor popups in logical terms. The `-start`/`-end` alignment suffix now
follows the reading direction, so a `bottom-start` popup (select, combobox,
menu button) aligns to its trigger's right edge in RTL instead of its left.
New `inline-start` and `inline-end` sides, each with optional `-start`/`-end`
alignment, open beside the anchor toward the reading direction.

Submenus of vertical menubars and vertical adaptive menus now default to
`inline-end-start`, so they open to the left in RTL. The physical `left*` and
`right*` placements keep working and are deprecated in favor of `inline-*`.
`resolveAnchorPlacement` exposes the resolution for other consumers.
