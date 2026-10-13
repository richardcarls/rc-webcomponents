---
'@rcarls/rc-app-bar': patch
'@rcarls/rc-webcomponents': patch
---

A bar with `scroll-behavior="hide"` now hides or reveals only after its scroll target travels
`hide-distance` (32px by default) in one direction. It used to reveal on any upward scroll, so a
1px reversal while reading or as a fling settled brought it back. Near the top it still always
shows.
