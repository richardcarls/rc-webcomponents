---
'@rcarls/rc-common': minor
'@rcarls/rc-toolbar': minor
'@rcarls/rc-search-bar': minor
'@rcarls/rc-splitter': minor
'@rcarls/rc-menu-button': minor
'@rcarls/rc-menubar': minor
'@rcarls/rc-theme-material': minor
---

**Breaking:** the `keyInteraction` directive and the `data-interaction-mode`
attribute are removed. The `rc-toolbar` and `rc-search-bar` focus rings, and
the `rc-theme-material` search bar elevation, now follow `:focus-visible`, so a
search bar also shows them when its input is focused by tap or click, as browsers
do for text inputs. `rc-toolbar` now ships `base.css`.

Migration: replace `[data-interaction-mode='keyboard']` selectors with
`:has(:focus-visible)` on the host, for example
`rc-search-bar:has(:focus-visible)::part(root)`.
