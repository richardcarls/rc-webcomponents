---
'@rcarls/rc-common': minor
'@rcarls/rc-adaptive-menu': patch
'@rcarls/rc-app-bar': patch
'@rcarls/rc-carousel': patch
'@rcarls/rc-fab': patch
'@rcarls/rc-menu-button': patch
'@rcarls/rc-scroller': patch
'@rcarls/rc-select': patch
---

Batch layout sampling into a shared animation-frame read phase so mounting a
large component route no longer alternates forced layout reads with component
writes. Closed anchored popups now skip placement work until they open, while
scroller boundaries, carousel positioning, flow state, and opted-in initial
scroll observation settle before the next paint.

Add `RafScheduler.schedulePhased()`, live `AnchorController.disabled` getters,
and the `ScrollObserverController.initialEvaluation` timing option.
