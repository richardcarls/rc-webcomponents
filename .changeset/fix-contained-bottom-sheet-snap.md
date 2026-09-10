---
'@rcarls/rc-bottom-sheet': patch
'@rcarls/rc-common': patch
---

<!-- markdownlint-disable MD041 -->

Keep resize pinning, drag origins, and snapped bottom sheets correctly
positioned when a layout-containing ancestor establishes a non-viewport
containing block. Report animated snap changes only after the sheet settles so
consumers can defer discrete content and accessibility state changes until the
surface motion completes. Expose resize-start timing so content can be prepared
before an interactive expansion reveals it.
