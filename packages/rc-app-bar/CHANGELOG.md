# @rcarls/rc-app-bar

## 0.6.0

### Minor Changes

- b6f52a2: Change the default `slot="center"` layout: it now fills the flexible space
  between leading and trailing, capped by the new
  `--rc-app-bar-center-max-inline-size` before it centers within available
  space instead of continuing to stretch, rather than always mirroring the
  leading/trailing edges to stay exactly viewport-centered. Add the new
  `center-symmetric` attribute to keep the previous behavior (exact
  viewport-centering regardless of asymmetric leading/trailing widths).

### Patch Changes

- b6f52a2: Defer app-bar layout measurements to animation frames, group geometry reads
  before style writes, and remeasure when symmetric centering changes live.
- Updated dependencies [6683eb9]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
  - @rcarls/rc-common@0.6.0

## 0.5.0

### Minor Changes

- d440edc: Add `--rc-app-bar-title-start-padding`, applied only when the leading slot is
  empty. Per the M3 Top App Bar spec, a headline with no navigation icon should
  align with the start margin of the content below the bar, not the bar's own
  edge padding (which is calibrated for the leading icon button's touch
  target). Defaults to `0px` (no behavior change for existing consumers).

### Patch Changes

- Updated dependencies [4ae2ef0]
- Updated dependencies [689340c]
  - @rcarls/rc-common@0.5.0

## 0.4.2

### Patch Changes

- @rcarls/rc-common@0.4.2

## 0.4.1

### Patch Changes

- @rcarls/rc-common@0.4.1

## 0.4.0

### Patch Changes

- 468e009: Document `variant`, `scroll-behavior`, `scroll-target`, and `scroll-threshold`
  attributes, and note the `data-scrolled`/`data-collapsed`/`data-hidden` and
  `:state()` environment-driven output convention in the class JSDoc.
- Updated dependencies [e57277f]
- Updated dependencies [ccca8e2]
- Updated dependencies [037b1b3]
  - @rcarls/rc-common@0.4.0

## 0.3.2

### Patch Changes

- Updated dependencies [88b4086]
  - @rcarls/rc-common@0.3.2

## 0.3.1

### Patch Changes

- @rcarls/rc-common@0.3.1

## 0.3.0

### Changed

- Update package metadata, README intro, and docs links.

### Fixed

- Defer layout measurements to the next animation frame to avoid measurement loops.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0

### Minor Changes

- Add rc-app-bar with headless grid layout, dual-mode scrolled state, and pinned/collapse/hide scroll behavior. Align strict TypeScript configuration, add dialog feature detection, and prepare all packages for public npm release with provenance publishing.

### Patch Changes

- @rcarls/rc-common@0.2.0
