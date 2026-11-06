---
'@rcarls/rc-transfer-list': minor
---

**Breaking:** panel and root state is now exposed as part names instead of
`data-*` attributes on parts, which page CSS could not select. A panel gains the
`empty` and `has-selection` parts; the root gains `can-move-up` and
`can-move-down`.

Migration: replace attribute selectors with combined part selectors, for example
`rc-transfer-list::part(selected-panel empty)`.
