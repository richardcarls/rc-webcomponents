# @rcarls/rc-fab-menu

## 0.4.1

### Patch Changes

- @rcarls/rc-common@0.4.1
- @rcarls/rc-menu@0.4.1
- @rcarls/rc-menu-button@0.4.1

## 0.4.0

### Minor Changes

- 4624eb2: Add the rc-fab-menu package for floating action menu surfaces.

### Patch Changes

- 55e8ab5: Preserve UA-like control and surface styling until an optional theme supplies decorative tokens.
  Restore themed button hover and pressed state layers, including a pointer-origin Material ripple.
- 83d4734: Document `position`/`placement` attributes and the 17 CSS custom properties
  that had no `@cssprop` tag, and correct 12 more whose documented default no
  longer matched the "preserve UA-like component defaults" pass (most default
  to `revert` now, and `--rc-fab-menu-popup-duration` defaults to `0ms`, not
  `160ms`). Also fix the package README's theming and properties tables to
  match, and the root README's dependency column, which was missing rc-common.
- Updated dependencies [e57277f]
- Updated dependencies [69e31c1]
- Updated dependencies [4cb5551]
- Updated dependencies [ccca8e2]
- Updated dependencies [037b1b3]
- Updated dependencies [3e89095]
  - @rcarls/rc-common@0.4.0
  - @rcarls/rc-menu-button@0.4.0
  - @rcarls/rc-menu@0.4.0
