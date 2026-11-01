---
'@rcarls/rc-textarea': patch
---

The editor now mirrors the native `<textarea>`'s `placeholder` as `aria-placeholder` from the
first render; it was only set when the textarea was replaced later. A server-rendered
`rc-textarea` now hydrates to the same result as a client render.
