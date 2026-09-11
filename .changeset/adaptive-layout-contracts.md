---
'@rcarls/rc-carousel': minor
'@rcarls/rc-list': minor
'@rcarls/rc-webcomponents': minor
---

Add coordinated list and list-item layout tokens so container queries can
stack unchanged content regions while preserving shared subgrid alignment.

Breaking for the pre-1.0 carousel API: remove the redundant
`variant="hero|multi-browse"` attribute and property. The variant only
changed slide geometry, which is already controlled by
`--rc-carousel-slide-size`. Remove `variant="hero"` without replacement;
replace `variant="multi-browse"` with
`--rc-carousel-slide-size: min(75%, 300px)`.
