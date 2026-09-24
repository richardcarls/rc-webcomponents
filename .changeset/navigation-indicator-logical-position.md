---
'@rcarls/rc-common': minor
'@rcarls/rc-navigation-bar': patch
'@rcarls/rc-navigation-rail': patch
---

Position the navigation indicator in logical coordinates, so it lands on the
current link in RTL and in vertical writing modes instead of mirroring to
the opposite side or swapping its width and height.

Add `physicalOffset`, the inverse of `logicalRect`: it turns a logical
offset from the start corner into the physical `translate` an element
anchored at `inset-inline-start`/`inset-block-start` needs.
