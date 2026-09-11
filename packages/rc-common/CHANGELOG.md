# @rcarls/rc-common

## 0.6.0

### Minor Changes

- 6683eb9: Add shared, lifecycle-safe click delegation and let interactive list items
  forward plain surface clicks to same-root native action targets while
  preserving nested and modified clicks.

### Patch Changes

- ee7ba6c: Keep resize pinning, drag origins, and snapped bottom sheets correctly
  positioned when a layout-containing ancestor establishes a non-viewport
  containing block. Report animated snap changes only after the sheet settles so
  consumers can defer discrete content and accessibility state changes until the
  surface motion completes. Expose resize-start timing so content can be prepared
  before an interactive expansion reveals it.
- 30eb232: Add icon-only activation-area sizing and Material icon-button variants. Align menu
  selection and submenu affordances, and keep anchored popups within the viewport
  across native and fallback positioning.

## 0.5.0

### Minor Changes

- 689340c: Remove pre-1.0 deprecated APIs: the boolean `keyNavigation` option, `rc-disclosure.fragment`,
  `rc-textarea.listNumbers`, `rc-textarea.label`, and `decorationsFromHtml`.

### Patch Changes

- 4ae2ef0: Fix `ItemsCollectionController` (used by `rc-listbox`, and transitively by
  `rc-select` and `rc-combobox`) toggling an option on the first touch contact
  instead of letting a scrollable options list scroll. Touch activation now
  waits for `pointerup` within a 10px tap threshold; a larger move cancels the
  pending activation. Mouse and pen still activate on `pointerdown`.

## 0.4.2

## 0.4.1

## 0.4.0

### Minor Changes

- ccca8e2: Add navigation bar and rail packages with shared active-indicator positioning.
- 037b1b3: Add shared drag gesture measurement and numeric snap helpers, migrate bottom
  sheet settling to the shared velocity lifecycle, and add anchored settling and
  swipe-to-collapse behavior to splitters.

### Patch Changes

- e57277f: Add Material 3 search-view, fixed-pane splitter, dialog scrim, and resize enhancements.

  `rc-search-bar` now supports `variant="view"`, controlled/default open state, search-view methods, a rich `suggestions` slot, and datalist-derived text suggestions. `rc-splitter` adds `mode="fixed"` for clampable pixel primary panes. `rc-common` now honors CSS max-size constraints during resize gestures, and `rc-dialog` exposes a scrim token plus resize handle/origin hooks used by themed surfaces.

## 0.3.2

### Patch Changes

- 88b4086: Fix Firefox for Android bug: `<label>`-wrapped multiple selects [Bugzilla 1475723](https://bugzilla.mozilla.org/show_bug.cgi?id=1475723)

## 0.3.1

## 0.3.0

### Breaking

- Remove `useInteractionModeAttr` from `KeyNavigationOptions`; use `keyInteraction` with `keyNavigation` when keyboard interaction state is needed.

### Added

- Add native-child, observer, animation-frame, typeahead, and scroll-ancestor utilities.
- Add typed listbox action option helpers and `ItemsCollectionController`.
- Add `KeyboardInteractionDirective` with `keyInteraction` and `KeyInteractionOptions` exports.

### Changed

- Add separator-role keyboard support and large-step arrow actions to keyboard navigation.
- Update package metadata, README intro, and docs links.

### Migration

- Pair `keyInteraction` with `keyNavigation` anywhere downstream code previously relied on `useInteractionModeAttr`.

## 0.2.0
