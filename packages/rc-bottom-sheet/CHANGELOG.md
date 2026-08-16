# @rcarls/rc-bottom-sheet

## 0.4.0

### Minor Changes

- 48cf73f: Add the rc-bottom-sheet package as a dialog-backed modal bottom-sheet surface.
- 037b1b3: Add shared drag gesture measurement and numeric snap helpers, migrate bottom
  sheet settling to the shared velocity lifecycle, and add anchored settling and
  swipe-to-collapse behavior to splitters.
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

### Patch Changes

- ebec800: Dock bottom sheets without a theme to the viewport block-end by default and
  support absolute positioning for non-modal sheets contained by a positioned ancestor.
  Center authored drag handles with a splitter-aligned pill treatment. Align the
  Material theme with its surface, elevation, scrim, drag-handle, and contextual
  button treatment.
- Updated dependencies [e57277f]
- Updated dependencies [ccca8e2]
- Updated dependencies [037b1b3]
  - @rcarls/rc-dialog@0.4.0
  - @rcarls/rc-common@0.4.0
