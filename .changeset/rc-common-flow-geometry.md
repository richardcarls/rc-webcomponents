---
'@rcarls/rc-common': minor
---

Add writing-mode and direction aware geometry helpers.

`resolveFlow(el)` reads an element's computed `writing-mode` and `direction`
and reports which physical axis the inline and block axes run along, and on
which side each starts. The other helpers translate through it:
`getScrollOffset`/`setScrollOffset` measure scroll distance from the logical
start (absorbing the negative `scrollLeft` of RTL and `vertical-rl` scroll
containers), `clientSize`/`scrollSize` read sizes along a logical axis,
`logicalRect` expresses a rect as logical offsets from its container,
`logicalDelta` projects a pointer delta onto a logical axis, and
`arrowKeys(orientation, flow)` maps an ARIA orientation to its next,
previous, and cross-axis arrow keys, flipped for RTL.

Components use these instead of comparing `direction` by hand, so RTL and
vertical writing modes are handled the same way everywhere.
