---
'@rcarls/rc-common': minor
'@rcarls/rc-toolbar': minor
'@rcarls/rc-menubar': patch
'@rcarls/rc-adaptive-menu': patch
'@rcarls/rc-segmented-button': patch
---

Expose and navigate the orientation a widget actually renders in. An
`orientation` attribute names a layout: `horizontal` runs along the inline
axis and `vertical` along the block axis, so both turn over in vertical
writing modes, the way a native `<input type="range">` does. Toolbar,
menubar, and adaptive menu now report the rendered orientation as
`aria-orientation`, and their arrow keys follow it, so a horizontal toolbar
in vertical text navigates with ArrowDown.

`keyNavigation` treats an explicit `navigationAxis` and role defaults as
layout orientations and converts them the same way; an explicit
`aria-orientation` attribute is still used as is. Add `renderedOrientation`
and a `FlowController` that keeps a host's writing mode and direction current
for rendering.

`rc-toolbar` now reflects `orientation` to its host attribute, and its
vertical layout is keyed off that attribute rather than `aria-orientation`.
