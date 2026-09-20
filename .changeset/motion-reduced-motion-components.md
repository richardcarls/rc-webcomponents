---
'@rcarls/rc-app-bar': minor
'@rcarls/rc-disclosure': minor
'@rcarls/rc-fab': minor
'@rcarls/rc-fab-menu': minor
'@rcarls/rc-list': minor
'@rcarls/rc-progress': minor
'@rcarls/rc-switch': minor
---

Several components handle `prefers-reduced-motion: reduce` in their own
shadow styles, outside a theme's reach, and refine it the same way the theme
layer already does: spatial motion (`translate`, `scale`, `transform`,
`inline-size`, `block-size`) goes fully to zero, while effects motion (color,
opacity) shortens instead of disappearing.

`rc-app-bar` zeros its host's hide/show `translate` but shortens the
expanded title's fade-in. `rc-disclosure` keeps its panel's expand/collapse
zeroed, but its summary/content backstop for a theme-added transition now
shortens instead of zeroing it outright. `rc-list-item`'s row and
state-layer transition only color and opacity, so the whole sweep shortens.
`rc-fab-menu`'s popup mixes `scale` with opacity/overlay/display under one
shared duration; reduced motion now zeros the scale and shortens the rest.
`rc-switch`'s thumb mixes background-color with inline-size/block-size/
transform the same way; the icons and track, which each transition only one
kind of property, needed only the zero-or-shorten call. `rc-fab`'s
scroll-reveal is opacity/visibility only with no time-based duration to
shorten in its scroll-linked path, so reduced motion narrows the scroll
window instead of collapsing it to zero; its JS-transition fallback path
shortens the same fade rather than removing it. `rc-progress`'s determinate
fill transition, previously unguarded under reduced motion, is now zeroed;
its indeterminate loop, a continuous sweep with no meaningful shortened
form, stays fully stopped rather than shortened.
