---
'@rcarls/rc-carousel': patch
'@rcarls/rc-webcomponents': patch
---

Avoid scheduling a redundant carousel update during the initial Lit lifecycle
while retaining initial pagination and dynamic slide synchronization.
