# @rcarls/rc-menu-button

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

### Patch Changes

- 1179f24: Drop the `@oddbird/css-anchor-positioning` polyfill. Browsers without full
  native anchor positioning now use `AnchorController`'s script positioning,
  which applies the same placement and flip rules and re-positions when the page
  scrolls or the viewport, anchor, or floating element resizes. Those browsers no
  longer download the 41 kB polyfill the first time a popup opens.
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

- f1ca82d: Add an anchored, non-modal popover package with a Material rich-tooltip recipe. Share native Popover API visibility and fallback behavior across existing popup components.
- f0f7511: Document `orientation` as the layout the trigger sits in, with the opening
  keys for each writing mode and direction, and the `inline-end-start` default
  placement under vertical orientation. List the
  `--rc-menu-button-popup-duration` custom property in the README.
- c5b6f15: Read a plain `[role="menubar"]` parent's `aria-orientation` as the
  orientation it renders, not its layout, so a menu button in a menubar row
  in vertical text opens with the right arrow key.
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
- Updated dependencies [687a9be]
- Updated dependencies [b87f27b]
- Updated dependencies [32ebead]
- Updated dependencies [bfefedd]
- Updated dependencies [c130173]
- Updated dependencies [11680b6]
- Updated dependencies [223d36c]
- Updated dependencies [7b91a44]
- Updated dependencies [aa04ead]
- Updated dependencies [ac65b5b]
- Updated dependencies [6d126fd]
- Updated dependencies [afcfef8]
- Updated dependencies [11ef1ad]
  - @rcarls/rc-common@0.7.0
  - @rcarls/rc-menu@0.7.0

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
