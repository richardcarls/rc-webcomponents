# @rcarls/rc-select

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
