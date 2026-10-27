# @rcarls/rc-virtual-canvas

## 0.7.0

### Patch Changes

- 5c006de: Ship component CSS minified. Package builds now run the CSS in Lit `css` styles
  and light-DOM structural styles through Lightning CSS, removing comments and
  whitespace while keeping source maps that resolve to each template. Rendered
  styles are unchanged.

  `@rcarls/rc-common` adds `cssText`, an identity tag that marks a plain CSS
  string for minification. `rc-chip`, `rc-disclosure`, and `rc-accordion` now
  depend on `@rcarls/rc-common` for it.

- 1740c28: Map browser client coordinates to content CSS pixels independently of the canvas
  backing-store resolution. Pointer coordinates no longer double under a 2x
  backing store, and CSS zoom no longer changes the meaning of content positions.
  `canvasScaleX` and `canvasScaleY` now report backing-store pixels per local CSS
  pixel, so they remain accurate when an ancestor applies CSS zoom.

## 0.6.0

### Patch Changes

- 57370e4: Align component metadata, aggregate framework typings, development-time native-child
  validation, controlled menu state, package declarations, and public documentation before the
  next release.

## 0.5.0

## 0.4.2

## 0.4.1

## 0.4.0

### Patch Changes

- 037b1b3: Add try/catch for ResizeObserver.observe() for WebKit TypeError
- d49cde9: Fix `contentWidth`/`contentHeight` so their HTML attributes are `content-width`/`content-height`,
  matching every other multi-word attribute in the library. They previously had no kebab-case
  mapping, so `<rc-virtual-canvas content-width="...">` was silently ignored.

## 0.3.2

## 0.3.1

## 0.3.0

### Added

- Add read-only `canvasScaleX` and `canvasScaleY` getters.

### Changed

- Update package metadata, README intro, and docs links.

## 0.2.0
