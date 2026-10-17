---
'@rcarls/rc-dialog': patch
'@rcarls/rc-theme-substrate': patch
---

Size fullscreen dialogs correctly under ancestor CSS zoom in browsers without
`currentCSSZoom`. The Substrate dialog entrance now fades without scaling the
surface, so resizing during the transition reads stable geometry.
