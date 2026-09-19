---
'@rcarls/rc-dialog': minor
'@rcarls/rc-bottom-sheet': minor
'@rcarls/rc-snackbar': minor
---

`rc-dialog`, `rc-bottom-sheet`, and `rc-snackbar` now fade in and out through
CSS alone, using `@starting-style` and a discrete `display`/`overlay`
transition, driven by the shared `--rc-motion-effects-*` tokens (and
`--rc-motion-spatial-*` for `rc-snackbar`'s slide). `showModal()`/`show()`/
`close()` all stay synchronous, and nothing in any of the three components
waits on the transition finishing, so a zero-duration theme or a browser
without support for the CSS involved both degrade to an instant, fully
correct open and close.

`rc-dialog` and `rc-bottom-sheet` animate opacity only, not a scale or slide
transform: both support pointer resize and read `getBoundingClientRect()` to
compute drag deltas, and a transform is a visual effect that
`getBoundingClientRect()` reports for as long as it's still animating,
corrupting that measurement if a resize or drag starts during the entrance.
`rc-snackbar` has no such feature, so it fades and slides up from the
block-end edge it's anchored to.
