# @rcarls/rc-carousel

## 0.7.0

### Minor Changes

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

### Patch Changes

- 5c006de: Ship component CSS minified. Package builds now run the CSS in Lit `css` styles
  and light-DOM structural styles through Lightning CSS, removing comments and
  whitespace while keeping source maps that resolve to each template. Rendered
  styles are unchanged.

  `@rcarls/rc-common` adds `cssText`, an identity tag that marks a plain CSS
  string for minification. `rc-chip`, `rc-disclosure`, and `rc-accordion` now
  depend on `@rcarls/rc-common` for it.

- 011f3c6: Keep combobox chips clear of their trailing toggle, reset native selects inside
  `rc-field`, keep controlled carousel accessibility state synchronized, and align
  Material chips, menus, lists, disclosures, nested editors, and bottom-sheet
  motion with their MD3 defaults.
- a6553ff: Batch layout sampling into a shared animation-frame read phase so mounting a
  large component route no longer alternates forced layout reads with component
  writes. Closed anchored popups now skip placement work until they open, while
  scroller boundaries, carousel positioning, flow state, and opted-in initial
  scroll observation settle before the next paint.

  Add `RafScheduler.schedulePhased()`, live `AnchorController.disabled` getters,
  and the `ScrollObserverController.initialEvaluation` timing option.

- b764a3c: Observe interface locale changes through containing shadow roots and the host's own document.
  An explicit empty `lang` now means an unknown locale rather than falling back to `<html lang>`.
  Typeahead compares complete grapheme prefixes, including decomposed accents and collation
  expansions. Default interpolating messages format numeric positions in the interface locale
  while translation callbacks continue to receive numbers and can accept an optional locale.
  Default messages isolate consumer text whose direction is unknown. Textarea content direction
  uses the native LTR fallback for neutral `dir="auto"` content, recognizes Arabic Letter Mark and
  isolate controls, and reruns plugins when the native textarea's `lang` or `dir` changes.
- 98628f7: Resolve the writing direction when a mouse drag starts, before the drag
  axis is chosen, so a carousel whose writing mode changed since its last
  scroll drags along its new inline axis on the first try. Touch and pen
  input keep native scrolling.
- ca309b6: Scroll, snap, and drag the track along the inline axis in logical terms, so
  navigation, swipe settling, and mouse dragging work in RTL and in vertical
  writing modes. Previously every slide index mapped to the wrong scroll
  position in RTL, where the track's scroll offset runs negative. The
  built-in previous and next chevrons also mirror in RTL.
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

- 40f9776: Add an APG carousel built on native CSS scroll snap, with optional navigation,
  pagination, mouse dragging, looping, and consumer-controlled slide sizing.
  Preserve controlled active-index behavior after rejected swipes, keep visual
  loop clones inert and out of forms, and degrade safely without intersection
  observation.

### Patch Changes

- e0de31d: Avoid scheduling a redundant carousel update during the initial Lit lifecycle
  while retaining initial pagination and dynamic slide synchronization.
- 7adbd76: Keep development diagnostics concise and prevent expected test fixtures from emitting noisy warnings.
- Updated dependencies [6683eb9]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
  - @rcarls/rc-common@0.6.0
