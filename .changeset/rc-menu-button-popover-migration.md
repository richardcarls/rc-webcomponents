---
'@rcarls/rc-menu-button': minor
---

Use the native Popover API for the popup panel instead of a `hidden` attribute
and `z-index`. Removes `--rc-menu-button-popup-z-index`; stacking is now
governed by top-layer insertion order.
