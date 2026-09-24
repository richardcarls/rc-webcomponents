---
'@rcarls/rc-carousel': patch
---

Resolve the writing direction when a mouse drag starts, before the drag
axis is chosen, so a carousel whose writing mode changed since its last
scroll drags along its new inline axis on the first try. Touch and pen
input keep native scrolling.
