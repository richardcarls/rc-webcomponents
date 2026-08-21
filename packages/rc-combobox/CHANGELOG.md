# @rcarls/rc-combobox

## 0.4.2

### Patch Changes

- @rcarls/rc-common@0.4.2
- @rcarls/rc-listbox@0.4.2
- @rcarls/rc-select@0.4.2

## 0.4.1

### Patch Changes

- @rcarls/rc-common@0.4.1
- @rcarls/rc-listbox@0.4.1
- @rcarls/rc-select@0.4.1

## 0.4.0

### Patch Changes

- acc913e: Document the `chips` and `listbox` CSS parts, the `filter-strategy` attribute, and the
  `--rc-combobox-chip-gap`, `--rc-combobox-chip-border`, `--rc-combobox-listbox-border`, and
  `--rc-combobox-shadow` custom properties in the generated API reference. Also correct the
  `allow-create` attribute tag to non-bracket form (it has a real settable `allowCreate`
  property) and fix stale README/docs prose that claimed a `default-value` HTML attribute exists
  for the inherited `defaultValue` property, which has no attribute mapping.
- fa9bed0: Fix the toggle button's size custom property so it is `--rc-combobox-toggle-size`, matching
  every other `--rc-combobox-*` token in the package. It previously reused rc-select's
  `--rc-select-toggle-indicator-size`, so setting `--rc-combobox-toggle-size` on `<rc-combobox>`
  silently did nothing.
- Updated dependencies [e57277f]
- Updated dependencies [8944083]
- Updated dependencies [ccca8e2]
- Updated dependencies [9c3bc6f]
- Updated dependencies [037b1b3]
  - @rcarls/rc-common@0.4.0
  - @rcarls/rc-listbox@0.4.0
  - @rcarls/rc-select@0.4.0

## 0.3.2

### Patch Changes

- Updated dependencies [88b4086]
  - @rcarls/rc-common@0.3.2
  - @rcarls/rc-select@0.3.2
  - @rcarls/rc-listbox@0.3.2

## 0.3.1

### Patch Changes

- @rcarls/rc-common@0.3.1
- @rcarls/rc-listbox@0.3.1
- @rcarls/rc-select@0.3.1

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
