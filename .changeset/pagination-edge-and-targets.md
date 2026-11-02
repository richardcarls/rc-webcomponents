---
'@rcarls/rc-pagination': patch
---

Preserve authored disabled states when pagination controls leave an edge. Numbered targets beyond
the page total now request the last page, and stale links do not navigate to an out-of-range URL.
