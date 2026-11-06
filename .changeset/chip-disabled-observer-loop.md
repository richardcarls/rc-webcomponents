---
'@rcarls/rc-chip': patch
---

A `disabled` or `readonly` `rc-chip` with a native button or checkbox no longer
freezes the page. The chip disabled its control on every sync, and each write
re-triggered the chip's own attribute observer, so the sync never stopped.
