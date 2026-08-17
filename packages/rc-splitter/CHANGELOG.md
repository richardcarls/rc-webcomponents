# @rcarls/rc-splitter

## 0.4.1

### Patch Changes

- @rcarls/rc-common@0.4.1

## 0.4.0

### Minor Changes

- e57277f: Add Material 3 search-view, fixed-pane splitter, dialog scrim, and resize enhancements.

  `rc-search-bar` now supports `variant="view"`, controlled/default open state, search-view methods, a rich `suggestions` slot, and datalist-derived text suggestions. `rc-splitter` adds `mode="fixed"` for clampable pixel primary panes. `rc-common` now honors CSS max-size constraints during resize gestures, and `rc-dialog` exposes a scrim token plus resize handle/origin hooks used by themed surfaces.

- 037b1b3: Add shared drag gesture measurement and numeric snap helpers, migrate bottom
  sheet settling to the shared velocity lifecycle, and add anchored settling and
  swipe-to-collapse behavior to splitters.

### Patch Changes

- 94c7807: Document the `label`, `orientation`, `mode`, `step`, `min`, `max`, `value`,
  `default-value`, `fixed`, `collapsible`, `snap-points`, and `swipe-velocity`
  attributes and the `rc-splitter-change` fired event in the generated API
  reference.
- be4dc7e: Bind pointer drag gestures to the rendered separator handle instead of caching
  the pre-render query result.
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

- Add collapsible separator controls.
- Add `min` and `max` pane size clamps.
- Add Ctrl+Arrow and Shift+Arrow keyboard resizing shortcuts.
- Add splitter handle and collapse-button styling surfaces.

### Changed

- Correct `aria-orientation` to describe the separator bar.
- Increase pointer target affordance for the drag handle.
- Update package metadata, README intro, and docs links.

### Fixed

- Prevent a spurious change event on first interaction.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0

### Patch Changes

- @rcarls/rc-common@0.2.0
