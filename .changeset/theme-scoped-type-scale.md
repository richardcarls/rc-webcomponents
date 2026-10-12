---
'@rcarls/rc-theme-material': minor
'@rcarls/rc-webcomponents': minor
---

Add a scoped type scale. An element with `data-rc-type-scale` multiplies every Material
type size and line height beneath it by `--rc-type-scale`, and derives the RC text
tokens built on them (`--rc-item-font-size`, `--rc-font-size`, `--rc-button-font`, and
related line heights) again from the scaled values, so lists, buttons, menus, and plain
text in the region grow together.

Marking the theme root itself scales the whole page, for an app-wide text size setting.
With `bridge.css` alone, RC text scales from the application's Material type tokens;
the application's Material tokens remain unchanged.
