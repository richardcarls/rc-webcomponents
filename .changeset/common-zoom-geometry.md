---
'@rcarls/rc-common': patch
'@rcarls/rc-list': patch
'@rcarls/rc-navigation-bar': patch
'@rcarls/rc-navigation-rail': patch
---

Convert viewport measurements to local CSS pixels when reordering items,
positioning navigation indicators, and clamping anchored popups under CSS zoom.
Reorder previews now account for the scroll container's zoom, while anchor
corrections settle without repeated overshoot.
