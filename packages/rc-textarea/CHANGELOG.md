# @rcarls/rc-textarea

## 0.3.1

### Patch Changes

- 808afe4: ### Fixed

  - Fix regression where the visible editor did not reflect `value` and `defaultValue` on first mount.
  - @rcarls/rc-common@0.3.1

## 0.3.0

### Added

- Add `parseDecorationsFromHtml` as the canonical HTML decoration helper.
- Add `rc-textarea` to `HTMLElementTagNameMap`.

### Changed

- Deprecate `decorationsFromHtml` in favor of `parseDecorationsFromHtml`.
- Rename internal Parchment blot classes and document helpers from `V2` to `RC`.
- Expand public JSDoc across the component and plugin APIs.
- Update package metadata, README intro, and docs links.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0
