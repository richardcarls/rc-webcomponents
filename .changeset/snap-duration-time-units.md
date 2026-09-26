---
'@rcarls/rc-common': patch
'@rcarls/rc-bottom-sheet': patch
'@rcarls/rc-splitter': patch
---

Read snap duration custom properties as CSS times. `--rc-bottom-sheet-snap-duration` and
`--rc-splitter-snap-duration` now accept seconds as well as milliseconds, so a theme motion
token such as `.3s` animates for 300 ms instead of finishing in a fraction of a millisecond.
`rc-common` exports the shared `parseCssTime` helper.
