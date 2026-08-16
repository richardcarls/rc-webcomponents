---
'@rcarls/rc-textarea': patch
---

Fix cursor position tracking in WebKit, where a plain Range from `getRangeAt()` does not
resolve inside `rc-textarea`'s open shadow root. This made every Enter press and
virtual-keyboard paragraph insert land at the start of the value instead of the cursor. Fall
back to `Selection.getComposedRanges()` when Chrome's non-standard `shadowRoot.getSelection()`
isn't available.
