---
'@rcarls/rc-splitter': patch
---

Follow the reading direction and writing mode. Pointer resizing measures the
primary pane from its logical start edge, so dragging works in RTL, where the
primary pane sits on the right; swipe-to-collapse uses logical deltas; the
separator reports the orientation it renders in, and its drag axis and
collapse shortcut follow it in vertical text. Separator borders, the collapse
button, and the drag handle use logical properties, and the collapse chevron
mirrors in RTL.
