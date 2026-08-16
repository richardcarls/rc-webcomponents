---
'@rcarls/rc-fab-menu': patch
---

Document `position`/`placement` attributes and the 17 CSS custom properties
that had no `@cssprop` tag, and correct 12 more whose documented default no
longer matched the "preserve UA-like component defaults" pass (most default
to `revert` now, and `--rc-fab-menu-popup-duration` defaults to `0ms`, not
`160ms`). Also fix the package README's theming and properties tables to
match, and the root README's dependency column, which was missing rc-common.
