---
'@rcarls/rc-scroller': patch
---

Compute the `at-block-*` and `at-inline-*` boundary attributes along logical
axes, so they are correct in vertical writing modes as well as RTL, and
recompute them at most once per animation frame instead of on every scroll
and resize callback.
