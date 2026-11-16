---
'@rcarls/rc-virtual-scroller': patch
---

`rc-virtual-scroller` keeps its current window while an ancestor skips its contents with
`content-visibility: hidden`, as it already does for `display: none`. Firefox reports grid rows
that were never laid out as `0px` tracks, which the scroller read as an irregular layout and
answered by rendering the whole collection, freezing the page while a hidden list pane changed.
