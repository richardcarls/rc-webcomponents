---
'@rcarls/rc-button': minor
---

Add `--rc-button-touch-target-overlap-inline-start` and
`--rc-button-touch-target-overlap-inline-end` for `icon-only` buttons, zero
by default. A theme or consumer sets one to let the accessible touch-target
inflation on that side overlap into whatever sits just outside the host,
such as a toolbar's own edge padding, instead of also reserving layout
space there: the visible icon shifts flush with that edge while the
invisible hit region keeps its full accessible size.
