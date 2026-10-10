---
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-win31': minor
'@rcarls/rc-webcomponents': minor
---

Declare `rc-base` before each theme's own layers. Components inject their structural
light-DOM CSS into `rc-base` at runtime, after the theme has loaded, which made it the last
and strongest layer on pages that don't declare their own order, so it could override theme
rules. Theme rules now win either way. Apps that declare their own layer order should list
`rc-base` before the theme layers.

Add a fourth theme layer, `rc-theme-*.overrides`, after `.components`. Each theme uses it to
keep `rc-adaptive-menu` overflow rows on the menu's item tokens. Theme button and menu-button
variants, such as Material's icon-only sizing and filled colors or Win31's bevelled native
buttons, no longer restyle an overflowed action as a standalone control. A demoted
icon-only `rc-menu-button` keeps its row padding and indicator inset.
