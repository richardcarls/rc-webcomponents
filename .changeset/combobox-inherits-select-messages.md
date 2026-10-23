---
'@rcarls/rc-common': minor
'@rcarls/rc-combobox': patch
---

`rc-combobox` now falls back to text registered under `rc-select`, below
its own `rc-combobox` text, so an app no longer registers the shared keys
twice. `resolveMessages()` and `MessagesController` take an `inherit` scope
for the same layering in other components: within each locale the
component's own scope wins, a more specific locale wins over its base
language, and only keys the component has defaults for are taken.
