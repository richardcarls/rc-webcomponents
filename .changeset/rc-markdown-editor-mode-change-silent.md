---
'@rcarls/rc-markdown-editor': patch
---

Fix `sourceMode` so host-driven writes are silent, matching the library's
controlled/uncontrolled convention. The property setter previously dispatched
`rc-mode-change` on every change regardless of source, so setting
`el.sourceMode = true` from a host fired the same user-interaction event as
the toolbar button or Ctrl+Shift+S. The event now only fires from those two
genuinely user-driven paths.
