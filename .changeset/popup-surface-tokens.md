---
'@rcarls/rc-menu': minor
'@rcarls/rc-adaptive-menu': minor
'@rcarls/rc-select': minor
'@rcarls/rc-combobox': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-win31': minor
'@rcarls/rc-webcomponents': minor
---

Add shared popup surface tokens: `--rc-popup-background`, `--rc-popup-color`,
`--rc-popup-border`, `--rc-popup-radius`, `--rc-popup-shadow`, and
`--rc-popup-padding-block`. Menus, adaptive-menu popups, and select and
combobox listboxes read them before their own fallbacks. Themes set them at the
theme root, so popups rendered inside other shadow roots keep the theme's
surface. Select and combobox add `--rc-*-listbox-background` and
`--rc-*-listbox-color`.

Breaking: popup surfaces no longer fall back to `--rc-control-radius`. Set
`--rc-popup-radius` (or the per-component radius token) to change popup
corners. The Material, Substrate, and Win31 themes no longer set per-component
popup surface tokens such as `--rc-menu-radius` or
`--rc-adaptive-menu-popup-background`; override the `--rc-popup-*` tokens
instead. Material select and combobox listboxes now use the menu container
color, Material forced-colors popups gain a border, and Substrate listboxes use
the menu shadow and padding.
