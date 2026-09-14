---
'@rcarls/rc-select': minor
---

Support acting as an `rc-field` control provider: `focus()`/`blur()` forward to the shadow-DOM
trigger, a real user-driven selection now dispatches native `input` and `change` on the slotted
`<select>` (a programmatic `value`/`defaultValue` write does not, matching `rc-textarea`'s
controlled-value contract), and a new `required` property mirrors the slotted select's own
`required` onto `aria-required` on the trigger.
