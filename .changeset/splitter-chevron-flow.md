---
'@rcarls/rc-splitter': patch
---

Point the collapse chevron at the primary pane in every writing mode and
direction. It is now chosen from the pane axis and the element's flow, so it
also turns correctly in vertical text, where it used to point across the
panes, and re-renders when an ancestor's `dir` changes.
