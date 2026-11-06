---
'@rcarls/rc-menu': patch
---

`rc-menu` no longer reserves a scrollbar gutter. Wherever scrollbars take up
space, as on most desktop browsers, every menu had an empty strip at its inline
end, and selected and hovered items stopped short of the edge. A menu taller than
its maximum size still scrolls.
