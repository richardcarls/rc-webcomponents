---
'@rcarls/rc-common': minor
'@rcarls/rc-markdown-editor': patch
'@rcarls/rc-textarea': patch
'@rcarls/rc-webcomponents': patch
---

`rc-markdown-editor` now names its rich editing surface from every label of its native
textarea, or the textarea's `aria-label`. It previously found only a `<label for>` placed
inside the element, so a label outside it, a wrapping label, or an `aria-label` left the
editor unnamed. Clicks on any of those labels now focus the active editing surface.

`rc-common` exports `nativeLabelText()`, which returns the text that names a native control
for copying onto a shadow-DOM surface that stands in for it. `rc-textarea` uses it too, and
now treats a whitespace-only `aria-label` as no label.
