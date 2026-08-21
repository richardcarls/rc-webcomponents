# @rcarls/rc-fab

## 0.4.2

### Patch Changes

- @rcarls/rc-common@0.4.2

## 0.4.1

### Patch Changes

- @rcarls/rc-common@0.4.1

## 0.4.0

### Patch Changes

- 55e8ab5: Preserve UA-like control and surface styling until an optional theme supplies decorative tokens.
  Restore themed button hover and pressed state layers, including a pointer-origin Material ripple.
- 9a4aa64: Fix `rc-fab`'s CSS custom property documentation to match the component's
  actual `revert`/unset fallbacks (background, color, radius, shadow, size,
  gap, padding, font, focus-ring, and transition properties all defer to the
  native button or a packaged theme, not the previously documented literal
  defaults), and document `position`, `scroll-reveal`, and the computed
  `scroll-below-threshold` attribute.
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

### Added

- Add scroll-reveal behavior for back-to-top floating action buttons.

### Changed

- Redesign the default behavior around the back-to-top use case.
- Update package metadata, README intro, and docs links.

### Fixed

- Generalize published FAB examples.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0
