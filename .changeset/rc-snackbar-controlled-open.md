---
'@rcarls/rc-snackbar': minor
---

Give `open` proper controlled/uncontrolled backing (host writes are silent,
new `default-open` attribute seeds initial visible state), matching every
other stateful `open`/`value` property in the library. `show()`, `close()`,
and `clear()` are unaffected.
