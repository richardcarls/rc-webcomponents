---
'@rcarls/rc-carousel': patch
---

`rc-carousel` pagination dots keep their 8px look but get a 24px hit area, the WCAG minimum target
size, and sit at least that far apart so neighboring targets don't overlap. The new
`--rc-carousel-pagination-target-size` sets the hit area.
