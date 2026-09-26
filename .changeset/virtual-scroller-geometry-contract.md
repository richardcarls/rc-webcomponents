---
'@rcarls/rc-virtual-scroller': minor
'@rcarls/rc-common': patch
'@rcarls/rc-webcomponents': patch
---

Harden virtual scrolling for document and element scroll containers, viewport resizing,
shadow-root focus, hidden panes, and uniform spanning grids. Separate layout
sampling from range calculation and avoid repeating item measurements during
unchanged scroll frames. Scroll ancestor discovery now follows slots and shadow hosts.

Breaking: `first` and `last` are read-only computed outputs. Use `scrollToIndex()`
for navigation and read `range` for rendering instead of assigning output values.
Virtualization requires uniform line pitch and capacity in sequential DOM order;
detected unsupported layouts render the full collection. Set `items-per-line`
for ambiguous uniform grid capacity, or remove it to restore automatic inference.
Numeric inputs now normalize invalid values and floor integer configuration.
