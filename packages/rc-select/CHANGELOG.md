# @rcarls/rc-select

## 0.4.1

### Patch Changes

- @rcarls/rc-common@0.4.1
- @rcarls/rc-listbox@0.4.1

## 0.4.0

### Patch Changes

- 9c3bc6f: Document the `listbox` CSS part, the `open`/`multiple`/`disabled`/`placeholder`/`display`
  attributes, and the `--rc-select-chip-gap`, `--rc-select-chip-border`,
  `--rc-select-listbox-border`, and `--rc-select-shadow` custom properties in the generated API
  reference.
- Updated dependencies [e57277f]
- Updated dependencies [8944083]
- Updated dependencies [ccca8e2]
- Updated dependencies [037b1b3]
  - @rcarls/rc-common@0.4.0
  - @rcarls/rc-listbox@0.4.0

## 0.3.2

### Patch Changes

- 88b4086: Fix Firefox for Android bug: `<label>`-wrapped multiple selects [Bugzilla 1475723](https://bugzilla.mozilla.org/show_bug.cgi?id=1475723)
- Updated dependencies [88b4086]
  - @rcarls/rc-common@0.3.2
  - @rcarls/rc-listbox@0.3.2

## 0.3.1

### Patch Changes

- @rcarls/rc-common@0.3.1
- @rcarls/rc-listbox@0.3.1

## 0.3.0

### Added

- Add typed listbox action option support through the embedded listbox.

### Changed

- Change the required native `<select>` child to the default slot.
- Normalize embedded listbox option styling around `--rc-listbox-*` custom properties.
- Update package metadata, README intro, and docs links.

### Migration

- Remove `slot="select"` from the native `<select>` child.

```diff
- <rc-select><select slot="select" name="status">...</select></rc-select>
+ <rc-select><select name="status">...</select></rc-select>
```

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0

### Patch Changes

- @rcarls/rc-common@0.2.0
- @rcarls/rc-listbox@0.2.0
