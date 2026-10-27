# @rcarls/rc-textarea-plugin-markdown

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

- 253ba66: Correct package dependency declarations and prevent bundled Markdown implementation types from
  leaking into the editor declarations.

  BREAKING CHANGE: `@rcarls/rc-textarea-adapters` now treats `@rcarls/rc-textarea` as a peer instead
  of installing it as a runtime dependency. Both textarea extension packages require a compatible
  pre-1 `@rcarls/rc-textarea` release; install it alongside either extension package when upgrading.

- 6b99ced: **Breaking:** replace `LineDisclosureController` with `FoldingActionController`.
  Pass a caller-owned panel as `target` and render it through a block widget, or pass
  `{ fromLine, toLine }` to fold source lines. Panel creation and content revision now
  belong to the plugin. Set `initiallyExpanded: false` to retain the old diagnostic
  panel default; call `clear()` when document identity changes.

  Folding actions keep source text, form values, and undo history intact. The Markdown
  plugin adds gutter folds for heading sections, lists, code blocks, block quotes,
  and GFM tables. The base gutter has a 24px minimum width; Material uses 48px.
  Folding buttons expose `fold-trigger` and `fold-icon` CSS parts, and
  `createMarkdownPlugin({ folding: { createTriggerIcon } })` lets consumers choose
  the Markdown fold icon.

## 0.6.0

## 0.5.0

## 0.4.2

## 0.4.1

## 0.4.0

## 0.3.2

## 0.3.1

## 0.3.0

### Changed

- Update package metadata, README intro, and docs links.

### Fixed

- Fix Markdown code-block language updates.

## 0.2.0

### Patch Changes

- @rcarls/rc-textarea@0.2.0
