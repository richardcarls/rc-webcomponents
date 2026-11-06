---
'@rcarls/rc-menu': minor
'@rcarls/rc-adaptive-menu': minor
'@rcarls/rc-theme-win31': minor
---

**Breaking:** a menu item's keyboard shortcut is now a `<kbd>` element. The
`data-rc-menu-shortcut` marker, its legacy `data-menu-shortcut` alias, and the
`data-rc-menu-icon` synonym of `data-rc-icon` are removed.

Migration: write `<kbd>Ctrl+N</kbd>` in place of
`<span data-rc-menu-shortcut>Ctrl+N</span>`, and mark menu icons with
`data-rc-icon` or `data-rc-menu-leading`.
