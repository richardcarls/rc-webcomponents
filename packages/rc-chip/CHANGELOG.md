# @rcarls/rc-chip

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
