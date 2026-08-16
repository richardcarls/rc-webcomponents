# @rcarls/rc-listbox

## 0.4.0

### Patch Changes

- 8944083: Document the `multiple`, `checkmark`, and `filter-strategy` attributes, add
  real defaults to the eight `--rc-listbox-*` option-styling custom properties
  that already had one in code but not in the JSDoc, add `@example` blocks to
  the `options` setter and `appendOption()`, and add the missing `checkmark`,
  `value`, and `defaultValue` rows to the README's API table.
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

### Breaking

- Render options as `<li role="option">` instead of `<div role="option">`.
- Remove `part="option-label"`.
- Move the component-owned structure into shadow DOM.

### Added

- Add typed action option rows and discriminated `rc-listbox-change` details.
- Add progressive enhancement from a pre-rendered `<ul>` with `<li>` options.

### Changed

- Normalize option styling around `--rc-listbox-*` custom properties.
- Inject base listbox styles into the component root.
- Update package metadata, README intro, and docs links.

### Migration

- Update CSS selectors from `div[role="option"]` to `li[role="option"]`.
- Replace `part="option-label"` styling with selectors for the option text structure now exposed by the component.
- Query light-DOM option data from the host; do not query the component shadow root for consumer option DOM.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0

### Patch Changes

- @rcarls/rc-common@0.2.0
