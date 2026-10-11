---
'@rcarls/rc-fab-menu': patch
'@rcarls/rc-webcomponents': patch
---

The open `rc-fab-menu` popup no longer draws the browser's default popover border, padding,
and background around its menu. Its styles replace `rc-menu-button`'s instead of extending
them, so the popup now resets those defaults itself and the slotted `rc-menu` draws the
only surface.
