---
'@rcarls/rc-carousel': minor
---

`rc-carousel` sizes slides by count: `--rc-carousel-slides-per-view` whole
slides share the track after `--rc-carousel-peek`. The defaults (`1` and
`4rem`) keep the previous `calc(100% - 4rem)` slide size, and an explicit
`--rc-carousel-slide-size` still replaces the derived size. The host matches
`:state(static)` while every slide fits and fires `rc-carousel-static-change`
when that changes.
