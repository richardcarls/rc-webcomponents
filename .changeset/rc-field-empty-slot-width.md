---
'@rcarls/rc-field': patch
---

Fix an empty `leading`/`trailing`/`prefix`/`suffix` slot silently keeping its layout box (and any
margin meant for the non-empty case), eating into the control's available width. The `.empty-slot`
class could never win against the id-selector rule setting its `display`, regardless of source
order.
