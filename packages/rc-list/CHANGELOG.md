# @rcarls/rc-list

## 0.7.0

### Minor Changes

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

- 6ec0857: Add `ordered` to `rc-list`. Visible items in an ordered list receive `aria-posinset` and
  `aria-setsize` so assistive technology reports their position; no counters render, and authored
  positions from a rendered slice of a longer list are kept.

  Add an expandable `details` region to `rc-list-item`. A button marked
  `data-rc-list-item-toggle` toggles it; the item wires `aria-expanded`, `aria-controls`, and the
  region's `hidden` state, supports controlled `expanded` and uncontrolled `default-expanded`
  state, and fires `rc-list-item-toggle`. Material styles the region as list supporting text.

- 54d9ead: Localize every component's built-in text. Button names, role
  descriptions, announcements, and default labels now resolve per key from
  the element's `messages` property, then from text registered with
  `registerMessages(locale, catalog)` in `@rcarls/rc-common`, then from the
  English defaults. The locale is the element's own `lang`, else
  `<html lang>`; an ancestor's `lang` is ignored, because it usually marks
  content rather than the interface. Components re-render when that locale
  changes or new text is registered. `RcMessageCatalog` types the catalog,
  and each package adds its scope to it.

  Numbers a component formats as text follow the same locale:
  `rc-progress`'s default percentage and `rc-splitter`'s `aria-valuetext`
  use `Intl.NumberFormat`. `TypeaheadController` matches prefixes with an
  `Intl.Collator`, so case and accents are ignored the way the locale
  ignores them, and takes a `locale` option. `ItemsCollectionController`'s
  `setCreateOption(text, label?)` takes the option's visible text from its
  caller.

  `rc-transfer-list`'s direction arrows are now decorative: screen readers
  read only the action name, and the arrows turn over in RTL.

  **Breaking:** chrome-text properties are replaced by `messages`. Migrate:

  - `rc-search-bar` `clear-label` / `clearLabel` → `messages.clear`
  - `rc-adaptive-menu` `overflow-label` / `overflowLabel` → `messages.overflow`
  - `rc-chip-group` `show-all-label` / `showAllLabel` and `show-less-label` /
    `showLessLabel` → `messages.showAll` and `messages.showLess`
  - `rc-select` and `rc-combobox` `dialog-confirm-label` /
    `dialogConfirmLabel` and `dialog-cancel-label` / `dialogCancelLabel` →
    `messages.done` and `messages.cancel`
  - `rc-editor-toolbar` `label` → `messages.toolbar`

  Per-instance names stay attributes, but now default to `undefined` and fall
  back to a message: `label` on `rc-adaptive-menu`, `rc-chip-group`,
  `rc-menubar`, and `rc-splitter`; `available-label` and `selected-label`
  on `rc-transfer-list`; `low-label` and `high-label` on `rc-range-slider`.
  Read the resolved name from the rendered `aria-label` instead of the
  property.

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

- c130173: Add pointer and keyboard reordering to `rc-list`.

  Set `reorderable` and give each item a native `<button data-rc-reorder-handle>`. People can drag
  a handle, and the items it passes shift out of the way while the nearest scroll container
  scrolls near its edges. On touch and pen, a long press on an item also starts a drag, while
  movement before activation remains available for scrolling. Or they can focus a handle and use
  Space, the block-axis arrow keys, Home, End, and Escape. Each step is announced, focus stays on
  the moved item's handle, and geometry and keys follow the writing mode. `reorderable` implies
  `ordered`.

  Each committed move fires a cancelable `rc-list-reorder` event with `{ item, from, to }`. Left
  alone, the list moves the node itself; a framework that renders the items cancels the event and
  reorders its own data. `reorderMessages` overrides the announcements and the handle hint.

  `rc-common` gains the `ReorderController` behind it and a `LiveAnnouncer` live-region helper.
  `rc-theme-material` styles the lifted item with the dragged elevation, surface, and state layer,
  animates the shifting items with standard motion, and presents plain handles as standard icon
  buttons.

### Patch Changes

- 38cd00c: Convert viewport measurements to local CSS pixels when reordering items,
  positioning navigation indicators, and clamping anchored popups under CSS zoom.
  Reorder previews now account for the scroll container's zoom, while anchor
  corrections settle without repeated overshoot.
- 5c006de: Ship component CSS minified. Package builds now run the CSS in Lit `css` styles
  and light-DOM structural styles through Lightning CSS, removing comments and
  whitespace while keeping source maps that resolve to each template. Rendered
  styles are unchanged.

  `@rcarls/rc-common` adds `cssText`, an identity tag that marks a plain CSS
  string for minification. `rc-chip`, `rc-disclosure`, and `rc-accordion` now
  depend on `@rcarls/rc-common` for it.

- 2dbeccf: Place rows by `aria-posinset` and `aria-setsize` when they carry them, so a
  virtualized list rendering only a slice gives first- and last-row styling to
  the set's real ends instead of the ends of the slice.
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

- b639e04: Add coordinated list and list-item layout tokens so container queries can
  stack unchanged content regions while preserving shared subgrid alignment.

  Breaking for the pre-1.0 carousel API: remove the redundant
  `variant="hero|multi-browse"` attribute and property. The variant only
  changed slide geometry, which is already controlled by
  `--rc-carousel-slide-size`. Remove `variant="hero"` without replacement;
  replace `variant="multi-browse"` with
  `--rc-carousel-slide-size: min(75%, 300px)`.

- a108336: Add shared-column `rc-list` and `rc-list-item` elements with standard and
  segmented appearances, default content truncation, and native-backed single or
  multiple selection coordination. Restore author-owned item state when native
  selection coordination ends.
- 6683eb9: Add shared, lifecycle-safe click delegation and let interactive list items
  forward plain surface clicks to same-root native action targets while
  preserving nested and modified clicks.

### Patch Changes

- a108336: Warn in development when `rc-card`/`rc-list-item` has `interactive` set but
  no way to resolve a click target: no `action-target`, and for
  `rc-list-item`, no native child checkbox/radio either. Surface clicks
  silently go nowhere in that state; the warning now says so at the point
  the row or card is set up wrong, instead of leaving it to be discovered
  by a user tapping a dead row or card.
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
- Updated dependencies [6683eb9]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
  - @rcarls/rc-common@0.6.0
