---
'@rcarls/rc-accordion': patch
---

`rc-accordion` now extends Lit's `ReactiveElement` with a light-DOM render root instead of
`HTMLElement`, so the package can be imported where no DOM exists, such as during a server
render. Behavior, attributes, and keyboard support are unchanged; the element now also
exposes Lit's `updateComplete` promise.
