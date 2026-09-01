---
'@rcarls/rc-menu-button': minor
---

Add `--rc-menu-button-touch-target-overlap-inline-start` and
`-inline-end` for an `icon-only` trigger, zero by default. A theme or
consumer sets one to let the accessible touch-target inflation on that
side overlap into whatever sits just outside the host, such as a toolbar's
own edge padding, instead of also reserving layout space there: the
visible trigger shifts flush with that edge while the invisible hit
region keeps its full accessible size. Mirrors `@rcarls/rc-button`'s own
touch-target overlap tokens.
