# @rcarls/rc-switch

## 0.7.0

### Minor Changes

- 6e548d9: Several components handle `prefers-reduced-motion: reduce` in their own
  shadow styles, outside a theme's reach, and refine it the same way the theme
  layer already does: spatial motion (`translate`, `scale`, `transform`,
  `inline-size`, `block-size`) goes fully to zero, while effects motion (color,
  opacity) shortens instead of disappearing.

  `rc-app-bar` zeros its host's hide/show `translate` but shortens the
  expanded title's fade-in. `rc-disclosure` keeps its panel's expand/collapse
  zeroed, but its summary/content backstop for a theme-added transition now
  shortens instead of zeroing it outright. `rc-list-item`'s row and
  state-layer transition only color and opacity, so the whole sweep shortens.
  `rc-fab-menu`'s popup mixes `scale` with opacity/overlay/display under one
  shared duration; reduced motion now zeros the scale and shortens the rest.
  `rc-switch`'s thumb mixes background-color with inline-size/block-size/
  transform the same way; the icons and track, which each transition only one
  kind of property, needed only the zero-or-shorten call. `rc-fab`'s
  scroll-reveal is opacity/visibility only with no time-based duration to
  shorten in its scroll-linked path, so reduced motion narrows the scroll
  window instead of collapsing it to zero; its JS-transition fallback path
  shortens the same fade rather than removing it. `rc-progress`'s determinate
  fill transition, previously unguarded under reduced motion, is now zeroed;
  its indeterminate loop, a continuous sweep with no meaningful shortened
  form, stays fully stopped rather than shortened.

### Patch Changes

- 5c006de: Ship component CSS minified. Package builds now run the CSS in Lit `css` styles
  and light-DOM structural styles through Lightning CSS, removing comments and
  whitespace while keeping source maps that resolve to each template. Rendered
  styles are unchanged.

  `@rcarls/rc-common` adds `cssText`, an identity tag that marks a plain CSS
  string for minification. `rc-chip`, `rc-disclosure`, and `rc-accordion` now
  depend on `@rcarls/rc-common` for it.

## 0.6.0

## 0.5.0

## 0.4.2

## 0.4.1

## 0.4.0

### Minor Changes

- b53b5d2: Add the rc-switch package for native checkbox switch enhancement.

### Patch Changes

- 55e8ab5: Preserve UA-like control and surface styling until an optional theme supplies decorative tokens.
  Restore themed button hover and pressed state layers, including a pointer-origin Material ripple.
- 04f5d75: Document all 28 `rc-switch` CSS custom properties in the generated API
  reference, including the two track-size properties that have no built-in
  default and must be set by a theme.
