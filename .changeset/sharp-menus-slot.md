---
'@rcarls/rc-menu': minor
'@rcarls/rc-menu-button': minor
'@rcarls/rc-theme-material': patch
'@rcarls/rc-theme-substrate': patch
'@rcarls/rc-webcomponents': patch
---

Replace rc-menu's generated submenu glyph with an author-supplied `indicator`
slot on rc-menu-button. Keep the decorative indicator inside the trigger bounds,
reserve label space for it, and expose theme-neutral size, color, and inset
tokens for Material, Substrate, and application themes.
