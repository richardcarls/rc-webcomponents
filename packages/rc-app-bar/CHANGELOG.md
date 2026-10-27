# @rcarls/rc-app-bar

## 0.7.0

### Minor Changes

- 8d6edf2: With `scroll-behavior="hide"`, `rc-app-bar` now publishes read-only geometry onto its scroll
  target: `--rc-app-bar-block-size`, its measured block size, and
  `--rc-app-bar-visible-block-size`, the same value or `0px` while hidden. Hiding only translates
  the bar, so a layout can now give its space back: stack the bar over the scroll container,
  reserve the block size as the container's block-start padding and scroll padding, and pin
  sticky content at the visible size minus the block size, since sticky offsets are measured
  inside that padding. The bar removes both values when it stops hiding, changes
  target, or disconnects.

  The Material design guide documents this recipe and the compact-height patterns for landscape
  phones: app bars that hide on scroll, side sheets instead of modal bottom sheets, full-screen
  task dialogs, media capped by the pane's height, and single-row sticky chips.

- 079e025: Standardize component styling contracts for the breaking 0.7 release.

  BREAKING CHANGE: Rename the Markdown editor's `--rme-*` properties to
  `--rc-markdown-editor-*`, `--rc-app-bar-background` to `--rc-app-bar-bg`,
  `--rc-textarea-radius` to `--rc-textarea-border-radius`, the transfer-list
  `--rc-transfer-list-panel-*` properties to `--rc-transfer-list-listbox-*`,
  `--rc-chip-group-webkit-scrollbar-display` to
  `--rc-chip-group-scrollbar-display`, and `--rc-text` to `--rc-field-text`.
  Compatibility aliases are intentionally not provided.

  BREAKING CHANGE: Replace `--rc-select-chip-padding-inline` and
  `--rc-combobox-chip-padding-inline` with explicit `*-padding-inline-start` and
  `*-padding-inline-end` tokens. Generated removable chips now reserve the full
  remove target and its edge offset, so their indicator cannot overlap label text.

  Add canonical app-bar elevation, transfer-list listbox radius, and textarea
  line-action tokens. Add logical `rc-chip` inline-padding properties so themes
  can implement Material's icon-aware spacing without overriding authored child
  styles. Make `rc-field` consume the shared semantic token layer,
  and place the `rc-chip` and `rc-search-bar` light-DOM structural styles in the
  `rc-base` cascade layer so normal consumer rules override them.

  Prevent decorative, `aria-hidden` trailing list content from intercepting a
  whole-row action target, and keep segmented-list item geometry from leaking
  into nested standard lists.

  Remove unused Material navigation-rail toggle tokens and obsolete list-item
  theme tokens. Register the segmented-button private theme seam and enforce
  token ownership, documentation, removed-name, selector-budget, and cascade
  layer contracts through the component architecture audit.

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

- 6f1df83: A bar with `scroll-behavior="hide"` now hides or reveals only after its scroll target travels
  `hide-distance` (32px by default) in one direction. It used to reveal on any upward scroll, so a
  1px reversal while reading or as a fling settled brought it back. Near the top it still always
  shows. A hidden bar reveals itself when focus moves into it and stays visible until focus leaves.
- b0a63ef: Calculate expanded app-bar collapse progress in the bar's CSS coordinate space
  when its scroll target and the bar have different effective CSS zoom.
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

### Minor Changes

- b6f52a2: Change the default `slot="center"` layout: it now fills the flexible space
  between leading and trailing, capped by the new
  `--rc-app-bar-center-max-inline-size` before it centers within available
  space instead of continuing to stretch, rather than always mirroring the
  leading/trailing edges to stay exactly viewport-centered. Add the new
  `center-symmetric` attribute to keep the previous behavior (exact
  viewport-centering regardless of asymmetric leading/trailing widths).

### Patch Changes

- b6f52a2: Defer app-bar layout measurements to animation frames, group geometry reads
  before style writes, and remeasure when symmetric centering changes live.
- Updated dependencies [6683eb9]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
  - @rcarls/rc-common@0.6.0

## 0.5.0

### Minor Changes

- d440edc: Add `--rc-app-bar-title-start-padding`, applied only when the leading slot is
  empty. Per the M3 Top App Bar spec, a headline with no navigation icon should
  align with the start margin of the content below the bar, not the bar's own
  edge padding (which is calibrated for the leading icon button's touch
  target). Defaults to `0px` (no behavior change for existing consumers).

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

- 468e009: Document `variant`, `scroll-behavior`, `scroll-target`, and `scroll-threshold`
  attributes, and note the `data-scrolled`/`data-collapsed`/`data-hidden` and
  `:state()` environment-driven output convention in the class JSDoc.
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

### Changed

- Update package metadata, README intro, and docs links.

### Fixed

- Defer layout measurements to the next animation frame to avoid measurement loops.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0

### Minor Changes

- Add rc-app-bar with headless grid layout, dual-mode scrolled state, and pinned/collapse/hide scroll behavior. Align strict TypeScript configuration, add dialog feature detection, and prepare all packages for public npm release with provenance publishing.

### Patch Changes

- @rcarls/rc-common@0.2.0
