---
'@rcarls/rc-common': patch
'@rcarls/rc-dialog': patch
---

Keep `ResizeController`'s resize grip at the end corner after the page
direction changes at runtime, and re-derive an author handle's resize
cursor too. A writing-mode change is picked up the next time a pointer
enters the element or the grip takes focus, since no event reports it.
