---
'@rcarls/rc-progress': minor
'@rcarls/rc-theme-material': patch
'@rcarls/rc-theme-substrate': patch
---

`rc-progress`'s determinate fill transition is now themeable through two new
CSS custom properties, `--rc-progress-fill-transition-duration` (default
`150ms`) and `--rc-progress-fill-transition-easing` (default `ease-out`),
replacing a hardcoded `0.15s ease-out` no theme could reach.

The indeterminate loop's easing changes from `ease-in-out` to `linear`. A
loop has no beginning or end to decelerate into or accelerate out of, so an
eased loop visibly pulses at each cycle boundary; Material 3 specifies linear
easing for indeterminate loops for the same reason.

`rc-theme-material` and `rc-theme-substrate` map the new duration/easing
properties to their effects-fast motion tokens; `rc-theme-win31` already sets
`transition: none` on the fill part directly and needs no change.
