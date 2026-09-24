---
'@rcarls/rc-virtual-scroller': minor
'@rcarls/rc-webcomponents': minor
---

Add `rc-virtual-scroller`, a headless virtualization wrapper.

Mounting a large collection as custom elements costs real time regardless of
`content-visibility: auto`: upgrade happens at parse and insertion, before
style resolves, so containment cannot prevent element construction. This
package stops the count of mounted elements from scaling with collection
size, without taking over rendering.

The element measures geometry against a slotted container and dispatches
`rc-virtual-scroller-range` with the visible `[start, end)` index range; the
consumer renders that slice into its own container with whatever it already
uses, and two spacer parts reserve the off-range scroll space. Column count
and row pitch are measured from the container's own `grid-template-columns`
rather than configured, so `auto-fill` and container queries stay
authoritative. The focused item is never dropped from the reported range, so
scrolling never silently resets keyboard focus to `<body>`.
