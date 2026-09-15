---
'@rcarls/rc-common': patch
---

Stop anchor-positioned popups from polling layout on every animation frame while idle. Geometry
is now checked during a bounded settling window and restarted by resize, scroll, visibility, or
relevant element changes.
