---
'@rcarls/rc-app-bar': minor
---

Add `--rc-app-bar-title-start-padding`, applied only when the leading slot is
empty. Per the M3 Top App Bar spec, a headline with no navigation icon should
align with the start margin of the content below the bar, not the bar's own
edge padding (which is calibrated for the leading icon button's touch
target). Defaults to `0px` (no behavior change for existing consumers).
