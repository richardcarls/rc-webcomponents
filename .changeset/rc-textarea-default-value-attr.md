---
'@rcarls/rc-textarea': patch
---

Fix `defaultValue` so its HTML attribute is `default-value`, matching every
other `default-*` attribute in the library. It previously had no kebab-case
mapping, so `<rc-textarea default-value="...">` was silently ignored.
