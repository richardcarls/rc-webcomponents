# @rcarls/rc-textarea

## 0.4.2

### Patch Changes

- @rcarls/rc-common@0.4.2

## 0.4.1

### Patch Changes

- @rcarls/rc-common@0.4.1

## 0.4.0

### Patch Changes

- 46810f7: Render line breaks immediately when Enter is pressed at the end of an editable line, including virtual-keyboard `beforeinput` events.
- 32b1dc4: Allow gutter typography to be themed independently with `--rc-textarea-gutter-font-family`.
- c50d9e2: Document the `root`, `gutter`, `gutter-cells`, `editor-area`, and `editor` CSS
  parts, all public attributes, and the `--rc-textarea-gutter-padding-inline-end`
  custom property in the generated API reference.
- be4f0ae: Fix `defaultValue` so its HTML attribute is `default-value`, matching every
  other `default-*` attribute in the library. It previously had no kebab-case
  mapping, so `<rc-textarea default-value="...">` was silently ignored.
- c40a1be: Add theme-neutral fast, default, and slow effects and spatial motion token
  pairs. Expose bottom-sheet settle easing through
  `--rc-bottom-sheet-snap-easing` and map sheet settling to the Material spatial
  motion scheme.

  Give direct-child bottom-sheet handles a full-width 48px interaction target
  while preserving the 32 by 4 pixel visual indicator. Replace rectangular
  mobile browser tap highlights on chips with themeable, shape-clipped state
  layers. Keep bottom-sheet snap targets docked to the block-end edge when CSS
  minimum or maximum sizing constrains their requested heights.

  Mount declaratively assigned textarea plugins at connection time and remount
  them after reconnection, preserving plugin effects and adopted styles in
  framework render lifecycles.

- aecba33: Fix cursor position tracking in WebKit, where a plain Range from `getRangeAt()` does not
  resolve inside `rc-textarea`'s open shadow root. This made every Enter press and
  virtual-keyboard paragraph insert land at the start of the value instead of the cursor. Fall
  back to `Selection.getComposedRanges()` when Chrome's non-standard `shadowRoot.getSelection()`
  isn't available.
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
