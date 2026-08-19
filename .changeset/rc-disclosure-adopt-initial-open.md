---
'@rcarls/rc-disclosure': patch
---

Fix `rc-disclosure` silently discarding an initial `<details open>` on connect.
`_setupDetails()` always synced the wrapped `<details>`'s open state from the host's own
`open` attribute, defaulting to closed whenever the host had no explicit `open` of its
own, even if the `<details>` markup said otherwise. Plain `<details open>` inside
`<rc-disclosure>` (no `open` on the host) now opens as expected, and the host adopts that
state instead of defaulting to closed. The host's own `open` attribute still wins whenever
it's set explicitly.
