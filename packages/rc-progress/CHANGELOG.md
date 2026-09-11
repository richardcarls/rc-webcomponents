# @rcarls/rc-progress

## 0.6.0

### Minor Changes

- 509ee64: Add `rc-progress`, a native `<progress>` enhancer with a formatted value
  display, a track and fill you can restyle with CSS custom properties, and a
  built-in fix for the indeterminate/undefined-binding footgun.

  Keep the native element as the uncontrolled source of truth, support releasing
  a controlled value, and react to live native `value`/`max` changes. Preserve a
  native determinate value while `indeterminate` temporarily removes its
  attribute.

  The bar renders at its intended height with no `display` attribute set,
  matching its own documented default: previously the track/fill/native
  `<progress>` are all absolutely positioned, contributing nothing to the
  control's normal-flow height, so with no value-display text sharing its grid
  row to give it one, the whole bar collapsed to 0px.

### Patch Changes

- Updated dependencies [6683eb9]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
  - @rcarls/rc-common@0.6.0
