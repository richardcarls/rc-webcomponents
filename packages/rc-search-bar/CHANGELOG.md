# @rcarls/rc-search-bar

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

- 2599c19: With `show-clear-on-focus`, Tab from the input now lands on the clear button and keeps focus there. The search bar stays focused while focus moves between its input and its own controls, so the button no longer turns inert while receiving focus and drops it to the page.
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

- ffcbf11: Add adaptive chip-group layouts, native-backed filter chips, and shared
  input-chip rendering. Native-backed chips preserve controlled host state,
  follow form resets when uncontrolled, and accept native link actions. Groups
  restore author-owned chip variants when coordination ends. Keep search input
  chrome inside the search surface and align contextual icon sizes with Material 3.
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

### Minor Changes

- e57277f: Add Material 3 search-view, fixed-pane splitter, dialog scrim, and resize enhancements.

  `rc-search-bar` now supports `variant="view"`, controlled/default open state, search-view methods, a rich `suggestions` slot, and datalist-derived text suggestions. `rc-splitter` adds `mode="fixed"` for clampable pixel primary panes. `rc-common` now honors CSS max-size constraints during resize gestures, and `rc-dialog` exposes a scrim token plus resize handle/origin hooks used by themed surfaces.

### Patch Changes

- ea9aa72: Document the `variant`, `debounce`, `clear-label`, `allow-native-clear`,
  `show-clear-on-focus`, `disabled`, `placeholder`, `open`, `default-open`, and
  `default-value` attributes, the `trailing` CSS part, and the
  `--rc-search-bar-view-border` and `--rc-search-bar-view-offset` CSS custom
  properties in the generated API reference.
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

- Add `--rc-search-bar-border` and `--rc-search-bar-shadow` styling hooks.

### Changed

- Align default appearance with sibling native-control wrappers.
- Replace `data-focus-visible` with the shared keyboard interaction state pattern.
- Keep the clear button in layout while inactive.
- Update package metadata, README intro, and docs links.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0
