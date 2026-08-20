---
'@rcarls/rc-bottom-sheet': patch
---

Fix `rc-bottom-sheet` snapping to stale geometry after a viewport resize (for example a
browser window maximize/restore) while open. Snap-point heights are resolved against the
current viewport at the moment a snap is applied, then frozen as inline `top`/`height`
styles; nothing re-derived them after that, so a resize with no drag or `snapTo()` call
in between left the sheet pinned to pre-resize pixel geometry. Now listens for `resize`
while open and re-applies the last-snapped index against fresh geometry.

Also stops pinning the inline axis (`left`/`width`) at all: only `top`/`height` are ever
read again after the initial pin, and freezing the inline axis as an inline style
permanently overrides any external stylesheet's `inset-inline`/`inline-size` confinement
(for example a host page confining a sheet to a layout pane narrower than the viewport)
regardless of specificity, since inline styles always win that cascade. `rc-bottom-sheet`'s
own `LIGHT_DOM_CSS` already deliberately leaves the inline axis CSS-owned; the pin just
wasn't honoring that.
