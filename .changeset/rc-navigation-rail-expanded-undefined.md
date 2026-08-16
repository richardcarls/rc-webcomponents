---
'@rcarls/rc-navigation-rail': patch
---

Fix `expanded` so assigning `undefined` releases control back to
`default-expanded`, matching the library's controlled/uncontrolled convention
used by `rc-switch`'s `checked` and other value-like properties. It previously
ignored `undefined` writes entirely, permanently locking the rail once
`expanded` had been set once.
