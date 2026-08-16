---
'@rcarls/rc-virtual-canvas': patch
---

Fix `contentWidth`/`contentHeight` so their HTML attributes are `content-width`/`content-height`,
matching every other multi-word attribute in the library. They previously had no kebab-case
mapping, so `<rc-virtual-canvas content-width="...">` was silently ignored.
