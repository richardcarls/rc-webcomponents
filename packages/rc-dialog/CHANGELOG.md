# @rcarls/rc-dialog

## 0.4.1

### Patch Changes

- @rcarls/rc-common@0.4.1

## 0.4.0

### Minor Changes

- e57277f: Add Material 3 search-view, fixed-pane splitter, dialog scrim, and resize enhancements.

  `rc-search-bar` now supports `variant="view"`, controlled/default open state, search-view methods, a rich `suggestions` slot, and datalist-derived text suggestions. `rc-splitter` adds `mode="fixed"` for clampable pixel primary panes. `rc-common` now honors CSS max-size constraints during resize gestures, and `rc-dialog` exposes a scrim token plus resize handle/origin hooks used by themed surfaces.

### Patch Changes

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

- Add non-modal `show()` support and the `modal` property for controlled open behavior.
- Add `rc-dialog-open` and `rc-dialog-toggle` events.

### Changed

- Warn in development when the inner `<dialog>` has no enabled button.
- Update package metadata, README intro, and docs links.

### Fixed

- Restore focus to `document.body` when the opener is removed while the dialog is open.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0

### Patch Changes

- @rcarls/rc-common@0.2.0
