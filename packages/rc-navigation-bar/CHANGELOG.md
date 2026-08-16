# @rcarls/rc-navigation-bar

## 0.4.0

### Minor Changes

- ccca8e2: Add navigation bar and rail packages with shared active-indicator positioning.

### Patch Changes

- 55e8ab5: Preserve UA-like control and surface styling until an optional theme supplies decorative tokens.
  Restore themed button hover and pressed state layers, including a pointer-origin Material ripple.
- 3a8df14: Document the `--rc-navigation-bar-indicator-border` and
  `--rc-navigation-bar-item-text-decoration` custom properties, and correct
  `--rc-navigation-bar-indicator-bg`, `--rc-navigation-bar-indicator-radius`,
  `--rc-navigation-bar-indicator-duration`, `--rc-navigation-bar-focus-ring`, and
  `--rc-navigation-bar-active-color`, which documented values from the Material
  and Substrate theme recipes instead of the component's own base defaults.
- e88eff8: Use the system link accent as the theme-free active-link fallback for navigation
  bar and rail destinations.
- Updated dependencies [e57277f]
- Updated dependencies [ccca8e2]
- Updated dependencies [037b1b3]
  - @rcarls/rc-common@0.4.0
