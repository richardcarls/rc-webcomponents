---
'@rcarls/rc-chip-group': patch
'@rcarls/rc-webcomponents': patch
---

`rc-chip-group` measures its rows once when it first lays out, not twice. Its resize observer's
first report of each chip no longer schedules another when it matches the first measurement;
a changed size still triggers another row measurement.
A collapsed row at its start is no longer scrolled back into place after each measurement,
which saves a forced layout.
