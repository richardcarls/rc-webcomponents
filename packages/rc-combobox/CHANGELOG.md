# @rcarls/rc-combobox

## 0.3.0

### Added

- Add typed action option support for `allow-create` flows.

### Changed

- Change the required native `<select>` child to the default slot.
- Normalize embedded listbox option styling around `--rc-listbox-*` custom properties.
- Replace the text chevron with an inline SVG chevron.
- Update package metadata, README intro, and docs links.

### Fixed

- Reflect `allowCreate` as the `allow-create` attribute instead of `allowcreate`.

### Migration

- Rename the `allowcreate` attribute to `allow-create`.

```diff
- <rc-combobox allowcreate>
+ <rc-combobox allow-create>
```

- Remove `slot="select"` from the native `<select>` child.

```diff
- <rc-combobox><select slot="select" name="tags">...</select></rc-combobox>
+ <rc-combobox><select name="tags">...</select></rc-combobox>
```

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0

### Patch Changes

- @rcarls/rc-common@0.2.0
- @rcarls/rc-listbox@0.2.0
- @rcarls/rc-select@0.2.0
