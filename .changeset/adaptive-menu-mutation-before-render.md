---
'@rcarls/rc-adaptive-menu': patch
'@rcarls/rc-webcomponents': patch
---

`rc-adaptive-menu` no longer throws when actions are added while its first render is still
pending. The action observer tried to give the overflow trigger a tab stop before the shadow
tree existed; changes before the first render are now left to the initial sync.
