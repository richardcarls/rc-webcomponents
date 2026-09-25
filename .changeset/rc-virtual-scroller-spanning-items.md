---
'@rcarls/rc-virtual-scroller': patch
---

Count items per line from where items render instead of from the grid's
track count, so a collection whose items span several tracks, such as a
shelf of cards aligned through subgrid across its rows, windows one item per
line instead of one per track.
