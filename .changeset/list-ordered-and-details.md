---
'@rcarls/rc-list': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-webcomponents': minor
---

Add `ordered` to `rc-list`. Visible items in an ordered list receive `aria-posinset` and
`aria-setsize` so assistive technology reports their position; no counters render, and authored
positions from a rendered slice of a longer list are kept.

Add an expandable `details` region to `rc-list-item`. A button marked
`data-rc-list-item-toggle` toggles it; the item wires `aria-expanded`, `aria-controls`, and the
region's `hidden` state, supports controlled `expanded` and uncontrolled `default-expanded`
state, and fires `rc-list-item-toggle`. Material styles the region as list supporting text.
