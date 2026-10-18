---
'@rcarls/rc-common': patch
---

Ship the ES module build as one file per source module behind the same
`rc-common.js` entry, so application bundlers can place shared code in lazily
loaded chunks instead of keeping every used export in the initial load. The
package exports and the UMD build are unchanged.
