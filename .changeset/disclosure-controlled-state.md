---
'@rcarls/rc-disclosure': minor
---

<!-- markdownlint-disable MD041 -->

Add `defaultOpen` and `default-open` for uncontrolled disclosure state. Host writes to `open`
now establish controlled mode, user toggles report the requested state without overriding the
host value, and assigning `undefined` releases control.
