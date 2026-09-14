---
'@rcarls/rc-field': patch
---

Prefer a control provider's own `disabled` property over its raw native control when both are
present. A provider disabling its control for an internal reason unrelated to the field's real
enabled/disabled intent (confirmed with `rc-select`'s GeckoView picker guard) no longer leaks
into `data-disabled` and the field's dimmed styling.
