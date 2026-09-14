---
'@rcarls/rc-combobox': patch
---

Fix a real user-driven "create new option" selection not dispatching native `input`/`change` on
the slotted `<select>` (`focus()`/`blur()` forwarding and `required` mirroring were already
correct through inheritance from `rc-select`'s new control-provider support). `aria-required`
now reflects on the input trigger.
