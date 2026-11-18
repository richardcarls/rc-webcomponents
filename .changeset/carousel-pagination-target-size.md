---
'@rcarls/rc-carousel': patch
---

`rc-carousel` pagination dots keep their 8px look but get a 24px hit area, the WCAG minimum target
size, and wrap onto centered rows so neighboring targets stay separate on narrow carousels. The new
`--rc-carousel-pagination-target-size` sets the hit area.
