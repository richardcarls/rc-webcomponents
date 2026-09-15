---
'@rcarls/rc-theme-substrate': minor
---

Theme the nine components Substrate left without a token contract.

`rc-adaptive-menu`, `rc-carousel`, `rc-chip-group`, and `rc-scroller` had no component CSS at
all. `rc-toolbar` and `rc-virtual-canvas` had a file that styled the element directly without
declaring a single `--rc-*` property. `rc-splitter` declared two colors that mixed against the
bare `Canvas` and `ButtonBorder` system colors, and the dialog scrim mixed against `CanvasText`,
so none of the three had a value that could leave CSS.

All are themed now, and the mixes point at the theme's own surface, border, and inverse surface
instead of at system colors. Every new color clears WCAG AA against the surface it is drawn on,
most of them AAA.

The splitter keeps its existing division of labor: this theme paints it and leaves its geometry
to the component's own defaults.

`rc-accordion` and `rc-disclosure` are unchanged. They read no `--rc-*` property anywhere in
their own styles, so there is nothing for a theme to set; giving them a contract is a change to
those components.
