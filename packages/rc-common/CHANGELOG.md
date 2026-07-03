# @rcarls/rc-common

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
