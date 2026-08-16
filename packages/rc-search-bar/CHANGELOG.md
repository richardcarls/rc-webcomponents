# @rcarls/rc-search-bar

## 0.4.0

### Minor Changes

- e57277f: Add Material 3 search-view, fixed-pane splitter, dialog scrim, and resize enhancements.

  `rc-search-bar` now supports `variant="view"`, controlled/default open state, search-view methods, a rich `suggestions` slot, and datalist-derived text suggestions. `rc-splitter` adds `mode="fixed"` for clampable pixel primary panes. `rc-common` now honors CSS max-size constraints during resize gestures, and `rc-dialog` exposes a scrim token plus resize handle/origin hooks used by themed surfaces.

### Patch Changes

- ea9aa72: Document the `variant`, `debounce`, `clear-label`, `allow-native-clear`,
  `show-clear-on-focus`, `disabled`, `placeholder`, `open`, `default-open`, and
  `default-value` attributes, the `trailing` CSS part, and the
  `--rc-search-bar-view-border` and `--rc-search-bar-view-offset` CSS custom
  properties in the generated API reference.
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

- Add `--rc-search-bar-border` and `--rc-search-bar-shadow` styling hooks.

### Changed

- Align default appearance with sibling native-control wrappers.
- Replace `data-focus-visible` with the shared keyboard interaction state pattern.
- Keep the clear button in layout while inactive.
- Update package metadata, README intro, and docs links.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0
