---
'@rcarls/rc-chip-group': patch
---

A scrolling single-line `rc-chip-group` now scrolls along its row when a mouse
wheel turns over it. A wheel only moves vertically and the row hides its
scrollbar, so mouse users had no way to reach chips past the visible edge. At
either end of the row, the wheel scrolls the page as usual. Horizontal deltas
from a touch pad or Shift+wheel, and rows in vertical writing modes, keep their
native scrolling.
