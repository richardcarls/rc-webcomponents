# @rcarls/rc-chip

## 0.6.0

### Minor Changes

- ffcbf11: Add adaptive chip-group layouts, native-backed filter chips, and shared
  input-chip rendering. Native-backed chips preserve controlled host state,
  follow form resets when uncontrolled, and accept native link actions. Groups
  restore author-owned chip variants when coordination ends. Keep search input
  chrome inside the search surface and align contextual icon sizes with Material 3.
- 0a462c5: Add `--rc-chip-touch-target-overlap-block-start` and `-block-end`, zero by
  default. A theme or consumer sets one to let a chip's accessible
  touch-target inflation on that side overlap into whatever sits just
  outside the host, such as a height-constrained field's own block padding
  (a multi-select value area in `rc-search-bar` or `rc-combobox`, say),
  instead of also reserving layout space there. The block-axis counterpart
  to `@rcarls/rc-button`'s, `@rcarls/rc-menu-button`'s, and
  `@rcarls/rc-adaptive-menu`'s own inline-axis touch-target overlap tokens.

### Patch Changes

- 7adbd76: Keep development diagnostics concise and prevent expected test fixtures from emitting noisy warnings.

## 0.5.0

## 0.4.2

## 0.4.1

## 0.4.0

### Minor Changes

- 74d9046: Add native button-based chip controls and let toolbars coordinate groups of
  interactive chips with roving focus.

### Patch Changes

- 55e8ab5: Preserve UA-like control and surface styling until an optional theme supplies decorative tokens.
  Restore themed button hover and pressed state layers, including a pointer-origin Material ripple.
- c926344: Document all `rc-chip` CSS custom properties, including the previously
  undocumented `--rc-chip-gap`, `--rc-chip-block-size`, `--rc-chip-radius`, and
  selection/disabled/focus tokens, and fix the `--rc-chip-removable-padding-inline-end`
  tag to show its real `calc()` default.
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

- 979b989: Use a zero default gap for tighter chip content layout and a smaller default
  font size for slotted remove icons. Derive removable content padding from the
  remove target width and chip gap so the label and trailing icon stay aligned.
