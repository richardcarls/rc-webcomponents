---
'@rcarls/rc-slider': minor
'@rcarls/rc-progress': minor
'@rcarls/rc-range-slider': minor
---

**Breaking:** the `root` part no longer carries `data-orientation`,
`data-has-value-text`, `data-disabled`, or `data-readonly`. Page CSS could not
select them, because `::part()` accepts no attribute selectors.

Migration: select the reflected host attributes instead, for example
`rc-slider[disabled]::part(root)` or `rc-progress[value-text]::part(root)`.
