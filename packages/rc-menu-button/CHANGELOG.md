# @rcarls/rc-menu-button

## 0.4.1

### Patch Changes

- @rcarls/rc-common@0.4.1
- @rcarls/rc-menu@0.4.1

## 0.4.0

### Minor Changes

- 3e89095: Replace rc-menu's generated submenu glyph with an author-supplied `indicator`
  slot on rc-menu-button. Keep the decorative indicator inside the trigger bounds,
  reserve label space for it, and expose theme-neutral size, color, and inset
  tokens for Material, Substrate, and application themes.

### Patch Changes

- 69e31c1: Document the `open`, `default-open`, and `orientation` attributes in the class
  JSDoc and package README. Only `placement` had an `@attr` tag, so the
  generated ApiTable and README were missing three of the four settable
  attributes.
- 4cb5551: Fix `defaultOpen` so it no longer reopens the menu after an explicit controlled
  `open = false` write. The setter compared against the live `_open` value
  instead of tracking whether a controlled write had occurred, so a common
  pattern like React always passing `open={false}` left the component thinking
  it was still uncontrolled.
- Updated dependencies [e57277f]
- Updated dependencies [ccca8e2]
- Updated dependencies [037b1b3]
- Updated dependencies [3e89095]
  - @rcarls/rc-common@0.4.0
  - @rcarls/rc-menu@0.4.0

## 0.3.2

### Patch Changes

- Updated dependencies [88b4086]
  - @rcarls/rc-common@0.3.2
  - @rcarls/rc-menu@0.3.2

## 0.3.1

### Patch Changes

- @rcarls/rc-common@0.3.1
- @rcarls/rc-menu@0.3.1

## 0.3.0

### Changed

- Normalize trigger styling around inherited menu-button custom properties.
- Update package metadata, README intro, and docs links.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0

### Patch Changes

- @rcarls/rc-common@0.2.0
- @rcarls/rc-menu@0.2.0
