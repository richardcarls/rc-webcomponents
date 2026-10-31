---
'@rcarls/rc-theme-material': patch
---

Focus and pressed state layers now use the current Material 3 opacity of 0.10, down from
the original 0.12, and the focus ring follows the Material 3 focus indicator: a 3px
`secondary` outline drawn 2px outside the control. The new
`--md-sys-state-focus-indicator-thickness` and
`--md-sys-state-focus-indicator-outer-offset` tokens carry the ring geometry.
