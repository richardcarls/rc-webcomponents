---
'@rcarls/rc-theme-material': patch
---

A promoted icon-only `rc-menu-button` in an `rc-adaptive-menu` no longer hides
the `[data-rc-label]` text of the items in its own menu. The theme now hides
only the action's own label, a direct child of the action or of its native
trigger.
