---
'@rcarls/rc-menu-button': patch
---

Read a plain `[role="menubar"]` parent's `aria-orientation` as the
orientation it renders, not its layout, so a menu button in a menubar row
in vertical text opens with the right arrow key.
