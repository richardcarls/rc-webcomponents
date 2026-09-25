---
'@rcarls/rc-common': minor
'@rcarls/rc-menu-button': minor
'@rcarls/rc-fab-menu': minor
'@rcarls/rc-select': patch
'@rcarls/rc-combobox': patch
'@rcarls/rc-adaptive-menu': patch
'@rcarls/rc-webcomponents': patch
---

Anchor popups in logical terms only. A placement is now `block-start`,
`block-end`, `inline-start`, or `inline-end`, each with an optional
`-start`/`-end` edge alignment, and all of them follow the writing mode and
direction. Block sides open above or below a row in horizontal text and
beside it in vertical text; inline sides open along the reading direction,
so `inline-end` opens to the left in RTL. `resolveAnchorPlacement` exposes
the resolution for other consumers.

**Breaking:** the physical placements `top*`, `bottom*`, `left*`, and
`right*` are removed from `AnchorPlacement`, `rc-menu-button`'s and
`rc-fab-menu`'s `placement`, and the React and Solid typings. Migrate:

- `bottom*` → `block-end*`
- `top*` → `block-start*`
- `right*` → `inline-end*` (in LTR)
- `left*` → `inline-start*` (in LTR)

Defaults move with them and render the same in horizontal LTR text:
`rc-menu-button`, `rc-select`, and `rc-combobox` open at `block-end-start`,
`rc-adaptive-menu`'s overflow menu at `block-end-end`, and `rc-fab-menu` at
`block-start-end`. In vertical text these popups now open beside their
trigger instead of over the next item. Vertical menubars and vertical
adaptive menus open submenus at `inline-end-start`.
