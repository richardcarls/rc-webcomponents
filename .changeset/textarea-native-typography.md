---
'@rcarls/rc-textarea': minor
---

When no theme sets `--rc-textarea-font-family`, the editor now copies the native
`<textarea>`'s font, line height, and spacing from the first render, so an unthemed
`rc-textarea` matches the native control's typography. Previously the copy only applied when
the textarea was replaced after the first render, so unthemed editors fell back to the
component's own `monospace` defaults; set `--rc-textarea-font-family` to keep them.
