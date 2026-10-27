# @rcarls/rc-fab-menu

## 0.7.0

### Minor Changes

- 9ee769c: Anchor popups in logical terms only. A placement is now `block-start`,
  `block-end`, `inline-start`, or `inline-end`, each with an optional
  `-start`/`-end` edge alignment, and all of them follow the writing mode and
  direction. Block sides open above or below a row in horizontal text and
  beside it in vertical text; inline sides open along the reading direction,
  so `inline-end` opens to the left in RTL. `resolveAnchorPlacement` exposes
  the resolution for other consumers.

  **Breaking:** the physical placements `top*`, `bottom*`, `left*`, and
  `right*` are removed from `AnchorPlacement`, `rc-menu-button`'s and
  `rc-fab-menu`'s `placement`, and the React and Solid typings. Migrate:

  - `bottom*` → `block-end*`
  - `top*` → `block-start*`
  - `right*` → `inline-end*` (in LTR)
  - `left*` → `inline-start*` (in LTR)

  Defaults move with them and render the same in horizontal LTR text:
  `rc-menu-button`, `rc-select`, and `rc-combobox` open at `block-end-start`,
  `rc-adaptive-menu`'s overflow menu at `block-end-end`, and `rc-fab-menu` at
  `block-start-end`. In vertical text these popups now open beside their
  trigger instead of over the next item. Vertical menubars and vertical
  adaptive menus open submenus at `inline-end-start`. Open popups also
  re-resolve their physical side and alignment when an ancestor's `dir`
  changes, and `rc-fab-menu` keeps its corner-aware default even when nested in
  a vertical menubar.

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

- 2d79bd0: Name the `position` corners for what they already do: each pins to a
  logical block and inline edge, so they turn with the writing mode.

  **Breaking:** the `position` values are renamed. Migrate:

  - `bottom-end` → `block-end-inline-end` (the default)
  - `bottom-start` → `block-end-inline-start`
  - `top-end` → `block-start-inline-end`
  - `top-start` → `block-start-inline-start`

- 94dc987: `rc-menu-button`'s, `rc-select`'s, and `rc-combobox`'s popup/listbox now fade
  in and out through CSS alone, using `@starting-style` and a discrete
  `display`/`overlay` transition, driven by new `--rc-menu-button-popup-duration`,
  `--rc-select-listbox-duration`, and `--rc-combobox-listbox-duration`
  properties. `showPopover()`/`hidePopover()` (via `openPopup()`/`closePopup()`)
  stay synchronous, and nothing waits on the transition finishing.

  These animate opacity only, not a scale or slide transform: all three
  position their popup with the shared `AnchorController`, which applies its
  own viewport-clamping `translate` and reads `getBoundingClientRect()` to
  compute the next correction. A second, CSS-driven transform on the same
  element and property would fight that positioning math on every open, not
  only during an edge case.

  `rc-fab-menu` already had a scale-based entrance for its popup (verified safe
  here: unlike the general `AnchorController` case, this popup isn't
  collision-clamped), but no exit animation at all and no directional easing.
  Both are added: the popup now fades and scales back out on close, and enter
  uses a decelerating curve while exit uses an accelerating one.

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

- d50f18c: The open `rc-fab-menu` popup no longer draws the browser's default popover border, padding,
  and background around its menu. Its styles replace `rc-menu-button`'s instead of extending
  them, so the popup now resets those defaults itself and the slotted `rc-menu` draws the
  only surface.
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
- Updated dependencies [94dc987]
- Updated dependencies [b9175e9]
- Updated dependencies [c8b762b]
- Updated dependencies [55e1e7f]
- Updated dependencies [f1ca82d]
- Updated dependencies [687a9be]
- Updated dependencies [b87f27b]
- Updated dependencies [32ebead]
- Updated dependencies [bfefedd]
- Updated dependencies [c130173]
- Updated dependencies [f0f7511]
- Updated dependencies [c5b6f15]
- Updated dependencies [11680b6]
- Updated dependencies [223d36c]
- Updated dependencies [7b91a44]
- Updated dependencies [aa04ead]
- Updated dependencies [ac65b5b]
- Updated dependencies [6d126fd]
- Updated dependencies [afcfef8]
- Updated dependencies [11ef1ad]
  - @rcarls/rc-common@0.7.0
  - @rcarls/rc-menu-button@0.7.0
  - @rcarls/rc-menu@0.7.0

## 0.6.0

### Patch Changes

- 57370e4: Align component metadata, aggregate framework typings, development-time native-child
  validation, controlled menu state, package declarations, and public documentation before the
  next release.
- Updated dependencies [7382c71]
- Updated dependencies [6683eb9]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
- Updated dependencies [30eb232]
- Updated dependencies [57370e4]
  - @rcarls/rc-menu@0.6.0
  - @rcarls/rc-menu-button@0.6.0
  - @rcarls/rc-common@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [4ae2ef0]
- Updated dependencies [d33b92f]
- Updated dependencies [689340c]
  - @rcarls/rc-common@0.5.0
  - @rcarls/rc-menu-button@0.5.0
  - @rcarls/rc-menu@0.5.0

## 0.4.2

### Patch Changes

- @rcarls/rc-common@0.4.2
- @rcarls/rc-menu@0.4.2
- @rcarls/rc-menu-button@0.4.2

## 0.4.1

### Patch Changes

- @rcarls/rc-common@0.4.1
- @rcarls/rc-menu@0.4.1
- @rcarls/rc-menu-button@0.4.1

## 0.4.0

### Minor Changes

- 4624eb2: Add the rc-fab-menu package for floating action menu surfaces.

### Patch Changes

- 55e8ab5: Preserve UA-like control and surface styling until an optional theme supplies decorative tokens.
  Restore themed button hover and pressed state layers, including a pointer-origin Material ripple.
- 83d4734: Document `position`/`placement` attributes and the 17 CSS custom properties
  that had no `@cssprop` tag, and correct 12 more whose documented default no
  longer matched the "preserve UA-like component defaults" pass (most default
  to `revert` now, and `--rc-fab-menu-popup-duration` defaults to `0ms`, not
  `160ms`). Also fix the package README's theming and properties tables to
  match, and the root README's dependency column, which was missing rc-common.
- Updated dependencies [e57277f]
- Updated dependencies [69e31c1]
- Updated dependencies [4cb5551]
- Updated dependencies [ccca8e2]
- Updated dependencies [037b1b3]
- Updated dependencies [3e89095]
  - @rcarls/rc-common@0.4.0
  - @rcarls/rc-menu-button@0.4.0
  - @rcarls/rc-menu@0.4.0
