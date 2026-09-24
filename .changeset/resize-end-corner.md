---
'@rcarls/rc-common': patch
'@rcarls/rc-dialog': patch
---

Put the default resize grip at the target's end corner, where browsers put
the native resize grip: bottom-right in LTR, bottom-left in RTL and in
`vertical-rl`. Keyboard resizing and the grip cursor act on the same corner,
so ArrowLeft widens a box from its left edge in RTL. An explicit `origin`
still selects the edge as before.
