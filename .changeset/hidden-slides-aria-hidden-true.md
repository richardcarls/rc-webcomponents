---
'@rcarls/rc-carousel': patch
'@rcarls/rc-page-turner': patch
---

Slides and pages that are out of view now get `aria-hidden="true"` instead of
an empty `aria-hidden`, which ARIA treats as undefined rather than hidden.
