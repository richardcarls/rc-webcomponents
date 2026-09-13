---
'@rcarls/rc-theme-material': patch
---

Restore a multiline control-provider field's top spacing so its label sits as
far below the field's top edge as a single-line field's label does. A
single-line field gets that space for free from centering content within a
taller field surface; a multiline control-provider's content fills the
surface's whole height instead, so the label sat flush against the top edge
with no room above it.
