# @rcarls/rc-markdown-editor

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

- 3325191: **Breaking:** take `rc-textarea`'s read-only state from the slotted `<textarea readonly>` and
  remove the `read-only` attribute and its display styling without border or padding. A read-only
  editor keeps the enabled field appearance, stays focusable and selectable, announces `aria-
readonly` with the native control's label, and rejects edits. The host reflects `data-readonly`,
  and `readOnly` is now a getter. The plugin `transform()` hook runs while the textarea is
  `readonly`.

  `rc-markdown-editor` passes its `read-only` state to a native textarea in its source editor.
  Material and Substrate fields skip the hover affordance for a read-only control and keep its
  focus indicator.

  Migration: replace `<rc-textarea read-only>` with `readonly` on the slotted textarea, for
  example `<rc-textarea><textarea aria-label="Notes" readonly></textarea></rc-textarea>`. Replace
  `editor.readOnly = value` with `textarea.readOnly = value`. Read-only content that is not a form
  value belongs in ordinary text or list markup instead.

### Patch Changes

- 5c006de: Ship component CSS minified. Package builds now run the CSS in Lit `css` styles
  and light-DOM structural styles through Lightning CSS, removing comments and
  whitespace while keeping source maps that resolve to each template. Rendered
  styles are unchanged.

  `@rcarls/rc-common` adds `cssText`, an identity tag that marks a plain CSS
  string for minification. `rc-chip`, `rc-disclosure`, and `rc-accordion` now
  depend on `@rcarls/rc-common` for it.

- ec6ebc6: Load dialog move and resize behavior on demand. `rc-dialog` now imports its
  drag and resize controllers only the first time `movable`, `move-handle`, or
  `resize` enables them, so dialogs that never move or resize, including the
  popups inside `rc-select`, `rc-combobox`, and `rc-markdown-editor`, no longer
  ship that code. The new `@rcarls/rc-dialog/geometry` entry exports
  `DialogGeometry` for subclasses that always resize; `rc-bottom-sheet` uses it,
  so its resize stays available immediately.

  Breaking changes and migration:

  - `rc-dialog` and `rc-bottom-sheet` remove `light-dismiss` / `lightDismiss`.
    Use `closed-by="any"`, which closes on Escape or a backdrop click and now
    falls back to a backdrop click listener where the browser has no native
    `closedby`.
  - `rc-bottom-sheet` now defaults `closed-by` to `any` instead of defaulting
    `light-dismiss` to true. Set `closed-by="closerequest"` to keep backdrop
    clicks from closing a sheet, or `closed-by="none"` to allow only explicit
    actions.

- b764a3c: Observe interface locale changes through containing shadow roots and the host's own document.
  An explicit empty `lang` now means an unknown locale rather than falling back to `<html lang>`.
  Typeahead compares complete grapheme prefixes, including decomposed accents and collation
  expansions. Default interpolating messages format numeric positions in the interface locale
  while translation callbacks continue to receive numbers and can accept an optional locale.
  Default messages isolate consumer text whose direction is unknown. Textarea content direction
  uses the native LTR fallback for neutral `dir="auto"` content, recognizes Arabic Letter Mark and
  isolate controls, and reruns plugins when the native textarea's `lang` or `dir` changes.
- cc0205d: Use logical CSS properties so layout follows the reading direction and
  writing mode: the textarea gutter border and alignment, line-action and
  diagnostic-message spacing, the markdown editor's block quote and list
  indents, and block-axis scrolling for listbox, select, combobox, and markdown
  panes, each keeping its physical declaration as a fallback.
- bdb8753: Position link popovers from selection viewport measurements in the popover's
  local CSS pixels under zoom, including right-edge alignment in RTL.
- 253ba66: Correct package dependency declarations and prevent bundled Markdown implementation types from
  leaking into the editor declarations.

  BREAKING CHANGE: `@rcarls/rc-textarea-adapters` now treats `@rcarls/rc-textarea` as a peer instead
  of installing it as a runtime dependency. Both textarea extension packages require a compatible
  pre-1 `@rcarls/rc-textarea` release; install it alongside either extension package when upgrading.

- 50c0657: Align the line-actions popover and the markdown editor's link popover to the
  inline start of what they belong to, so they sit under the right edge in RTL
  instead of the left.
- f0d0fba: Load the select dialog popup and selected-value chips on first use.
  `rc-select` and `rc-combobox` now import `rc-dialog` only for
  `popup-mode="dialog"` and `rc-chip-group` only for `multiple`, so a popover
  single select ships neither. The markdown editor toolbar picks the heading level
  with a native `<select>`, styled by the existing
  `--rc-markdown-editor-toolbar-select-*` properties, and no longer depends on
  `rc-select`.

  Breaking change and migration:

  - Importing `@rcarls/rc-select/define` or `@rcarls/rc-combobox/define` no
    longer registers `rc-dialog`, `rc-chip-group`, or `rc-chip`. Import their own
    `define` entries where the page uses those elements directly.

- Updated dependencies [e3dfa59]
- Updated dependencies [50d5610]
- Updated dependencies [9ee769c]
- Updated dependencies [1179f24]
- Updated dependencies [9f590f2]
- Updated dependencies [fbf240b]
- Updated dependencies [595fe37]
- Updated dependencies [38cd00c]
- Updated dependencies [5c006de]
- Updated dependencies [079e025]
- Updated dependencies [a6553ff]
- Updated dependencies [2205478]
- Updated dependencies [4341311]
- Updated dependencies [899bb5e]
- Updated dependencies [25fcfe0]
- Updated dependencies [51f6403]
- Updated dependencies [9caca6b]
- Updated dependencies [b764a3c]
- Updated dependencies [cc0205d]
- Updated dependencies [54d9ead]
- Updated dependencies [b9175e9]
- Updated dependencies [c8b762b]
- Updated dependencies [55e1e7f]
- Updated dependencies [50c0657]
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
- Updated dependencies [905083b]
- Updated dependencies [6b99ced]
- Updated dependencies [8387c20]
- Updated dependencies [c328259]
- Updated dependencies [f1433a9]
- Updated dependencies [d3fc2f3]
- Updated dependencies [3325191]
- Updated dependencies [4617b45]
- Updated dependencies [0e2d878]
- Updated dependencies [54067cc]
- Updated dependencies [57d6371]
- Updated dependencies [11ef1ad]
  - @rcarls/rc-common@0.7.0
  - @rcarls/rc-button@0.7.0
  - @rcarls/rc-textarea@0.7.0
  - @rcarls/rc-toolbar@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies [ffcbf11]
- Updated dependencies [7adbd76]
- Updated dependencies [30eb232]
- Updated dependencies [53baa54]
- Updated dependencies [53baa54]
- Updated dependencies [985067e]
- Updated dependencies [57370e4]
  - @rcarls/rc-select@0.6.0
  - @rcarls/rc-button@0.6.0
  - @rcarls/rc-textarea@0.6.0
  - @rcarls/rc-toolbar@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [689340c]
  - @rcarls/rc-textarea@0.5.0
  - @rcarls/rc-select@0.5.0
  - @rcarls/rc-toolbar@0.5.0
  - @rcarls/rc-button@0.5.0

## 0.4.2

### Patch Changes

- @rcarls/rc-button@0.4.2
- @rcarls/rc-select@0.4.2
- @rcarls/rc-textarea@0.4.2
- @rcarls/rc-toolbar@0.4.2

## 0.4.1

### Patch Changes

- @rcarls/rc-button@0.4.1
- @rcarls/rc-select@0.4.1
- @rcarls/rc-textarea@0.4.1
- @rcarls/rc-toolbar@0.4.1

## 0.4.0

### Patch Changes

- b7270df: Compose the Markdown editor toolbar from `rc-toolbar`, `rc-button`, and
  `rc-select`, and include native buttons inside direct `rc-button` wrappers in
  toolbar roving-focus navigation.
- 0ae93fc: Document `rc-markdown-editor`'s `toolbar`/`rich-view` CSS parts, its 18 CSS
  custom properties, the `value`/`default-value` attributes, and its default
  slot, plus `rc-editor-toolbar`'s full set of `active-*`, `code-language`, and
  `source-mode` attributes, in the generated API reference.
- 756eb36: Fix `sourceMode` so host-driven writes are silent, matching the library's
  controlled/uncontrolled convention. The property setter previously dispatched
  `rc-mode-change` on every change regardless of source, so setting
  `el.sourceMode = true` from a host fired the same user-interaction event as
  the toolbar button or Ctrl+Shift+S. The event now only fires from those two
  genuinely user-driven paths.
- 2946bd9: Fix `value` so it can be set declaratively via the `value` HTML attribute. It
  previously had no `@property` decorator at all, so `<rc-markdown-editor
value="...">` was silently ignored and only the JS `.value` assignment worked.
- ffce603: Preserve controlled Markdown values across initial rich/source mode setup,
  ignore change events emitted by the inactive source editor, and sanitize rich
  Markdown output while retaining the editor's supported underline markup. Keep
  source-mode focus and read-only behavior aligned with the active editor surface.
- Updated dependencies [5312d29]
- Updated dependencies [b7270df]
- Updated dependencies [46810f7]
- Updated dependencies [32b1dc4]
- Updated dependencies [51b2c8f]
- Updated dependencies [55e8ab5]
- Updated dependencies [f1b38b5]
- Updated dependencies [e11c4b7]
- Updated dependencies [74d9046]
- Updated dependencies [9c3bc6f]
- Updated dependencies [c50d9e2]
- Updated dependencies [be4f0ae]
- Updated dependencies [4df89fd]
- Updated dependencies [c40a1be]
- Updated dependencies [aecba33]
  - @rcarls/rc-button@0.4.0
  - @rcarls/rc-toolbar@0.4.0
  - @rcarls/rc-textarea@0.4.0
  - @rcarls/rc-select@0.4.0

## 0.3.2

### Patch Changes

- Updated dependencies [88b4086]
  - @rcarls/rc-select@0.3.2
  - @rcarls/rc-textarea@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies [808afe4]
  - @rcarls/rc-textarea@0.3.1
  - @rcarls/rc-select@0.3.1

## 0.3.0

### Added

- Add an inline link popover for link creation, editing, opening, and removal.
- Add word expansion for collapsed character-format selections.
- Add Ctrl/Cmd-click link opening in rich mode.
- Add active link toolbar state.

### Changed

- Render rich-mode links with pointer cursor and underline styling.
- Update package metadata, README intro, and docs links.

### Fixed

- Give the heading-level select an accessible name.
- Fix Markdown code-block language updates through the published plugin path.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0

### Patch Changes

- @rcarls/rc-textarea@0.2.0
