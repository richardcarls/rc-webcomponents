# @rcarls/rc-bottom-sheet

## 0.6.0

### Patch Changes

- ee7ba6c: Keep resize pinning, drag origins, and snapped bottom sheets correctly
  positioned when a layout-containing ancestor establishes a non-viewport
  containing block. Report animated snap changes only after the sheet settles so
  consumers can defer discrete content and accessibility state changes until the
  surface motion completes. Expose resize-start timing so content can be prepared
  before an interactive expansion reveals it.
- Updated dependencies [6683eb9]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
- Updated dependencies [57370e4]
  - @rcarls/rc-common@0.6.0
  - @rcarls/rc-dialog@0.6.0

## 0.5.0

### Patch Changes

- ba65db7: Fix an edge case left in the 0.4.2 resize-repin fix: the window-resize re-pin re-measured
  via `getBoundingClientRect()` on the box that was still carrying its _previous_ inline pin,
  so a fixed (non-`dvh`) snap point (for example a `132px` peek height, common for a
  persistent summary sheet) computed the exact same, now-stale target, since neither the
  requested height nor the stale box's edges had changed. Only `dvh`-based snap points were
  actually re-deriving correctly. Now clears the previous `top`/`height` pin before
  re-measuring on resize, so the dialog reverts to its CSS-driven (`inset-block-end`-anchored)
  position first, the same as a sheet that has never been pinned. Added a regression test
  covering this specific case (confirmed it fails without the fix).
- Updated dependencies [4ae2ef0]
- Updated dependencies [689340c]
  - @rcarls/rc-common@0.5.0
  - @rcarls/rc-dialog@0.5.0

## 0.4.2

### Patch Changes

- 5178dcc: Fix `rc-bottom-sheet` snapping to stale geometry after a viewport resize (for example a
  browser window maximize/restore) while open. Snap-point heights are resolved against the
  current viewport at the moment a snap is applied, then frozen as inline `top`/`height`
  styles; nothing re-derived them after that, so a resize with no drag or `snapTo()` call
  in between left the sheet pinned to pre-resize pixel geometry. Now listens for `resize`
  while open and re-applies the last-snapped index against fresh geometry.

  Also stops pinning the inline axis (`left`/`width`) at all: only `top`/`height` are ever
  read again after the initial pin, and freezing the inline axis as an inline style
  permanently overrides any external stylesheet's `inset-inline`/`inline-size` confinement
  (for example a host page confining a sheet to a layout pane narrower than the viewport)
  regardless of specificity, since inline styles always win that cascade. `rc-bottom-sheet`'s
  own `LIGHT_DOM_CSS` already deliberately leaves the inline axis CSS-owned; the pin just
  wasn't honoring that.
  - @rcarls/rc-common@0.4.2
  - @rcarls/rc-dialog@0.4.2

## 0.4.1

### Patch Changes

- @rcarls/rc-common@0.4.1
- @rcarls/rc-dialog@0.4.1

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
