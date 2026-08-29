---
'@rcarls/rc-scroller': minor
---

Add reflected `at-block-start`, `at-block-end`, `at-inline-start`, and
`at-inline-end` attributes, tracking whether the scroller is at each edge
on its enabled axes. Lets a consumer drive an edge-fade, shadow, or other
affordance from outside the shadow root without hand-rolling a scroll
listener and ResizeObserver.
