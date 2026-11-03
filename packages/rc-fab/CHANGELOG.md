# @rcarls/rc-fab

## 0.7.0

### Minor Changes

- 2d79bd0: Name the `position` corners for what they already do: each pins to a
  logical block and inline edge, so they turn with the writing mode.

  **Breaking:** the `position` values are renamed. Migrate:

  - `bottom-end` → `block-end-inline-end` (the default)
  - `bottom-start` → `block-end-inline-start`
  - `top-end` → `block-start-inline-end`
  - `top-start` → `block-start-inline-start`

- 6e548d9: Several components handle `prefers-reduced-motion: reduce` in their own
  shadow styles, outside a theme's reach, and refine it the same way the theme
  layer already does: spatial motion (`translate`, `scale`, `transform`,
  `inline-size`, `block-size`) goes fully to zero, while effects motion (color,
  opacity) shortens instead of disappearing.

  `rc-app-bar` zeros its host's hide/show `translate` but shortens the
  expanded title's fade-in. `rc-disclosure` keeps its panel's expand/collapse
  zeroed, but its summary/content backstop for a theme-added transition now
  shortens instead of zeroing it outright. `rc-list-item`'s row and
  state-layer transition only color and opacity, so the whole sweep shortens.
  `rc-fab-menu`'s popup mixes `scale` with opacity/overlay/display under one
  shared duration; reduced motion now zeros the scale and shortens the rest.
  `rc-switch`'s thumb mixes background-color with inline-size/block-size/
  transform the same way; the icons and track, which each transition only one
  kind of property, needed only the zero-or-shorten call. `rc-fab`'s
  scroll-reveal is opacity/visibility only with no time-based duration to
  shorten in its scroll-linked path, so reduced motion narrows the scroll
  window instead of collapsing it to zero; its JS-transition fallback path
  shortens the same fade rather than removing it. `rc-progress`'s determinate
  fill transition, previously unguarded under reduced motion, is now zeroed;
  its indeterminate loop, a continuous sweep with no meaningful shortened
  form, stays fully stopped rather than shortened.

### Patch Changes

- 5c006de: Ship component CSS minified. Package builds now run the CSS in Lit `css` styles
  and light-DOM structural styles through Lightning CSS, removing comments and
  whitespace while keeping source maps that resolve to each template. Rendered
  styles are unchanged.

  `@rcarls/rc-common` adds `cssText`, an identity tag that marks a plain CSS
  string for minification. `rc-chip`, `rc-disclosure`, and `rc-accordion` now
  depend on `@rcarls/rc-common` for it.

- a6553ff: Batch layout sampling into a shared animation-frame read phase so mounting a
  large component route no longer alternates forced layout reads with component
  writes. Closed anchored popups now skip placement work until they open, while
  scroller boundaries, carousel positioning, flow state, and opted-in initial
  scroll observation settle before the next paint.

  Add `RafScheduler.schedulePhased()`, live `AnchorController.disabled` getters,
  and the `ScrollObserverController.initialEvaluation` timing option.

- 899bb5e: Make `rc-dialog` move and resize options reactive. Toggling `movable`,
  changing `resize`, or changing any other `move-*` or `resize-*` option after
  setup now rebuilds that behavior, so `resize="none"` turns resizing off on a
  mounted `rc-dialog` or `rc-bottom-sheet` and a later value turns it back on.
  Re-wiring the inner `<dialog>` no longer leaves stale move or resize
  controllers attached. `DragController`, `ResizeController`, and
  `DragGestureController` gain `dispose()`. Detaching a handle restores its
  focusability and inline resize styles when they still have controller-written
  values, while preserving later author edits. Active gestures cancel
  and release pointer capture when their controller is removed. `rc-fab` uses
  the new `ScrollObserverController.dispose()` for its optional scroll fallback.
- Updated dependencies [e3dfa59]
- Updated dependencies [50d5610]
- Updated dependencies [9ee769c]
- Updated dependencies [1179f24]
- Updated dependencies [595fe37]
- Updated dependencies [38cd00c]
- Updated dependencies [5c006de]
- Updated dependencies [a6553ff]
- Updated dependencies [2205478]
- Updated dependencies [4341311]
- Updated dependencies [899bb5e]
- Updated dependencies [25fcfe0]
- Updated dependencies [51f6403]
- Updated dependencies [9caca6b]
- Updated dependencies [b764a3c]
- Updated dependencies [54d9ead]
- Updated dependencies [b9175e9]
- Updated dependencies [c8b762b]
- Updated dependencies [55e1e7f]
- Updated dependencies [f1ca82d]
- Updated dependencies [b87f27b]
- Updated dependencies [32ebead]
- Updated dependencies [bfefedd]
- Updated dependencies [c130173]
- Updated dependencies [11680b6]
- Updated dependencies [223d36c]
- Updated dependencies [7b91a44]
- Updated dependencies [aa04ead]
- Updated dependencies [ac65b5b]
- Updated dependencies [afcfef8]
- Updated dependencies [11ef1ad]
  - @rcarls/rc-common@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies [6683eb9]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
  - @rcarls/rc-common@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [4ae2ef0]
- Updated dependencies [689340c]
  - @rcarls/rc-common@0.5.0

## 0.4.2

### Patch Changes

- @rcarls/rc-common@0.4.2

## 0.4.1

### Patch Changes

- @rcarls/rc-common@0.4.1

## 0.4.0

### Patch Changes

- 55e8ab5: Preserve UA-like control and surface styling until an optional theme supplies decorative tokens.
  Restore themed button hover and pressed state layers, including a pointer-origin Material ripple.
- 9a4aa64: Fix `rc-fab`'s CSS custom property documentation to match the component's
  actual `revert`/unset fallbacks (background, color, radius, shadow, size,
  gap, padding, font, focus-ring, and transition properties all defer to the
  native button or a packaged theme, not the previously documented literal
  defaults), and document `position`, `scroll-reveal`, and the computed
  `scroll-below-threshold` attribute.
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

### Added

- Add scroll-reveal behavior for back-to-top floating action buttons.

### Changed

- Redesign the default behavior around the back-to-top use case.
- Update package metadata, README intro, and docs links.

### Fixed

- Generalize published FAB examples.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0
