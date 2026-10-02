---
'@rcarls/rc-menu': minor
'@rcarls/rc-listbox': minor
'@rcarls/rc-adaptive-menu': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-win31': minor
'@rcarls/rc-webcomponents': minor
---

Add shared item type tokens: `--rc-item-font-family`, `--rc-item-font-size`,
`--rc-item-font-weight`, `--rc-item-line-height`, `--rc-item-letter-spacing`,
and `--rc-item-icon-size`. Menu, listbox, and adaptive-menu items read them.
Adaptive menu adds `--rc-adaptive-menu-trigger-hover-background`,
`--rc-adaptive-menu-trigger-shadow`, and
`--rc-adaptive-menu-trigger-active-shadow`, and styles overflowed `rc-button`
and `rc-menu-button` rows from its item tokens. Themes declare their menu,
adaptive-menu, and item tokens on the theme root, so menus inside other shadow
roots match menus in the document. Substrate's adaptive-menu trigger now shows
its hover background.

Breaking: theme menu and adaptive-menu tokens are inherited from the theme root
instead of set on each element, so a value set on an ancestor now reaches
nested menus. Material sets menu, listbox, and adaptive-menu item type through
`--rc-item-*` instead of per-component rules; override those tokens to change
item type. Themes no longer style the adaptive-menu trigger through
`::part(overflow-trigger)` hover and pressed rules; use the new trigger tokens.
