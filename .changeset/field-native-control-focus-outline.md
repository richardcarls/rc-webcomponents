---
'@rcarls/rc-theme-material': patch
'@rcarls/rc-theme-substrate': patch
'@rcarls/rc-webcomponents': patch
---

Clear a page-level focus outline from a native input, select, or textarea inside `rc-field`. The
field already shows focus, but rc-field's `::slotted()` reset loses to page rules such as a CSS
reset's Firefox `:-moz-focusring` outline, which drew a dotted box inside the focused field.
