---
'@rcarls/rc-chip-group': patch
'@rcarls/rc-webcomponents': patch
---

`rc-chip-group` measures its rows once when it first lays out, not twice. Its resize observer's
first report of each chip, which follows the first measurement, no longer schedules another.
A collapsed row at its start is no longer scrolled back into place after each measurement,
which saves a forced layout.
