---
'@rcarls/rc-bottom-sheet': minor
---

Activating an `rc-bottom-sheet` resize handle without dragging it, with a click,
tap, Enter, or Space, now moves the sheet to the next snap point. It continues in
the direction the sheet last moved and turns back at the first or last point, as
Material's drag handle does. `rc-bottom-sheet-snap` reports these moves with the
new `trigger: 'activate'`.

**Migration:** a consumer that already steps the sheet from its own handle click
handler should either drop that handler and react to `rc-bottom-sheet-snap`
instead, or call `preventDefault()` in a click listener on the handle itself so
the sheet leaves the click alone. Without one of those, each click steps twice.
