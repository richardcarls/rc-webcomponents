---
'@rcarls/rc-virtual-scroller': patch
---

Re-resolve the writing direction when a `dir` attribute changes, and at the
start of every `scrollToIndex` call, so an inline-axis scroller keeps the
right range and scrolls to the right item after a page switches direction.
