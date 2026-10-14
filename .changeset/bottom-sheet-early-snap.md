---
'@rcarls/rc-bottom-sheet': patch
---

A `snapTo()` call made before the sheet's inner `<dialog>` is attached, as
from a framework ref callback, now applies when the sheet opens instead of
being dropped, so a sheet rendered open starts at the requested snap point.
