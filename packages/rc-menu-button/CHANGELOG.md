# @rcarls/rc-menu-button

## 0.6.0

### Minor Changes

- 30eb232: Add icon-only activation-area sizing and Material icon-button variants. Align menu
  selection and submenu affordances, and keep anchored popups within the viewport
  across native and fallback positioning.
- 30eb232: Add `--rc-menu-button-touch-target-overlap-inline-start` and
  `-inline-end` for an `icon-only` trigger, zero by default. A theme or
  consumer sets one to let the accessible touch-target inflation on that
  side overlap into whatever sits just outside the host, such as a toolbar's
  own edge padding, instead of also reserving layout space there: the
  visible trigger shifts flush with that edge while the invisible hit
  region keeps its full accessible size. Mirrors `@rcarls/rc-button`'s own
  touch-target overlap tokens.

### Patch Changes

- 7382c71: Add a priority-aware action toolbar that moves original controls into an
  overflow menu. Which actions are promoted is a purely declarative computation
  from `max-shown` and each action's `data-priority`/authored `slot`, with no
  runtime measurement of the toolbar's or its children's rendered size: a
  consumer whose promoted count needs to react to available space owns that
  decision and writes the resulting `max-shown` value down. Include controlled
  and uncontrolled open state, keyboard navigation, light dismissal, and a
  non-Popover fallback.

  Fix `--rc-adaptive-menu-touch-target-overlap-inline-start`/`-end`: the host's
  own `max-inline-size: 100%` self-referenced a shrink-to-fit ancestor's
  already-margin-reduced auto size (an app bar's own trailing group, for
  example), quietly clamping the host back down and canceling the overlap out
  from under it. The cap now grows by the overlap amount so it only ever bounds
  the host's real content.

- 57370e4: Align component metadata, aggregate framework typings, development-time native-child
  validation, controlled menu state, package declarations, and public documentation before the
  next release.
- Updated dependencies [7382c71]
- Updated dependencies [6683eb9]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
  - @rcarls/rc-menu@0.6.0
  - @rcarls/rc-common@0.6.0

## 0.5.0

### Minor Changes

- d33b92f: Use the native Popover API for the popup panel instead of a `hidden` attribute
  and `z-index`. Removes `--rc-menu-button-popup-z-index`; stacking is now
  governed by top-layer insertion order.

### Patch Changes

- Updated dependencies [4ae2ef0]
- Updated dependencies [689340c]
  - @rcarls/rc-common@0.5.0
  - @rcarls/rc-menu@0.5.0

## 0.4.2

### Patch Changes

- @rcarls/rc-common@0.4.2
- @rcarls/rc-menu@0.4.2

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
