---
'@rcarls/rc-button': patch
'@rcarls/rc-chip': patch
'@rcarls/rc-fab': patch
'@rcarls/rc-fab-menu': patch
'@rcarls/rc-menu-button': patch
---

Enabled buttons now show a pointer cursor, matching links: the native button in
`rc-button`, `rc-fab`, and an interactive `rc-chip`, plus the `rc-fab-menu` and
`rc-menu-button` triggers. Disabled and busy buttons, read-only chips, and a
cascading submenu trigger (an `rc-menu-button` marked `role="menuitem"`) keep the
default cursor.
