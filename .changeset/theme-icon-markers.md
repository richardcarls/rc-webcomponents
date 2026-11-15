---
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-tailwind': minor
'@rcarls/rc-theme-win31': minor
---

**Breaking:** every theme gives `[data-rc-icon]` the same geometry: a marked
icon is a `1em` square at the theme's icon size. It holds that square before
an icon element renders (Material already reserved it), and a marked `svg` or
`img` takes the theme size whatever its own `width` and `height` say (Win31
already sized marked icons). `rc-theme-material` also sizes every direct
child of an icon-only `rc-button`'s native button to that square.

Migration: an icon that must keep its own size drops `data-rc-icon` or sets
`--rc-icon-font-size` on itself.
