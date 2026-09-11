---
'@rcarls/rc-disclosure': minor
---

Add `defaultOpen` and `default-open` for uncontrolled disclosure state. Host writes to `open`
now establish controlled mode, user toggles report the requested state without overriding the
host value, and assigning `undefined` releases control.
