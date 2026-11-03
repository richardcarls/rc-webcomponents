# @rcarls/rc-textarea

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

- 905083b: Give `rc-textarea` a content language and direction separate from its
  interface. The slotted `<textarea>` describes the text: its `lang` and
  `spellcheck` are mirrored onto the editor, so the browser picks the right
  glyphs and spelling dictionary, and its `dir` sets the editor's base
  direction. `dir="auto"` resolves from the value's first strong character,
  uses LTR when there is none (matching native HTML), and updates as the value changes.
  Without `dir`, the editor inherits as before. The host's own `lang` stays
  the interface language.

  A new `line-direction` attribute (`lineDirection` property) chooses how
  each line's direction is set. `base`, the default, keeps every line in the
  editor's direction. `auto` orders and aligns each line with a letter by its
  own first strong character, for prose that mixes scripts, and holds lines
  without one (empty lines, quantities) to the base direction. Widgets and
  line messages are now bidi-isolated, so they never reorder neighboring
  text.

  Changes to the native textarea's `lang` or `dir` rerun plugin rendering.
  The plugin API adds `contentDirection`, `contentLang` and
  `lineDirection(line)`. The React and Solid typings add `lineDirection` and
  `line-direction`.

  **Breaking:**

  - Line numbers are formatted with `Intl.NumberFormat` for the interface
    locale (the host's `lang`, else `<html lang>`), so an `ar-EG` interface
    shows Arabic-Indic digits. Set `lang="ar-EG-u-nu-latn"`, or another
    `-u-nu-latn` tag, on the host to keep Latin digits.
  - `getWordAtCursor()` segments words with `Intl.Segmenter` for the
    textarea's `lang` instead of matching ASCII `\w`. Accented and non-Latin
    words are now found whole, and `don't` and `3.14` are one word each;
    `snake_case` still is. Without `Intl.Segmenter` it scans letters, digits
    and `_`.

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

- d3fc2f3: Add independent line disclosures with accessible gutter or trailing controls,
  configurable trigger icons, block widgets, and DOM gutter markers. Preserve keyed
  widget content across unchanged renders and exclude diagnostic content from source
  copying. Accessible widgets use
  Tab for focus navigation; ordinary text editors retain tab insertion.
  Gutter disclosures can retain a line-number lane alongside the trigger and other
  markers, including when line numbers are toggled after mount.
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

- 0e2d878: **Breaking:** replace `--rc-textarea-padding` with `--rc-textarea-padding-block` and
  `--rc-textarea-padding-inline`. The active line highlight bleeds through the inline padding by
  negating it, which a multi-value shorthand made invalid: inside a Material filled `rc-field`
  (`0 1rem 0.5rem`) the highlight stopped short of the field's edges in the editor and gutter.
  `--rc-textarea-padding-inline` is one length applied to both inline sides, so the bleed stays
  valid and follows RTL and vertical writing modes through logical insets.
  `--rc-textarea-padding-block` accepts any `padding-block` value.

  Migration: split each `--rc-textarea-padding` declaration. A single length `L` becomes
  `--rc-textarea-padding-block: L; --rc-textarea-padding-inline: L`. A shorthand
  `T X B` becomes `--rc-textarea-padding-block: T B; --rc-textarea-padding-inline: X`.

### Patch Changes

- 5c006de: Ship component CSS minified. Package builds now run the CSS in Lit `css` styles
  and light-DOM structural styles through Lightning CSS, removing comments and
  whitespace while keeping source maps that resolve to each template. Rendered
  styles are unchanged.

  `@rcarls/rc-common` adds `cssText`, an identity tag that marks a plain CSS
  string for minification. `rc-chip`, `rc-disclosure`, and `rc-accordion` now
  depend on `@rcarls/rc-common` for it.

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
- 50c0657: Align the line-actions popover and the markdown editor's link popover to the
  inline start of what they belong to, so they sit under the right edge in RTL
  instead of the left.
- 8387c20: Extend the `rc-textarea` active-line highlight edge to edge. The active line
  and its gutter cell now paint `--rc-textarea-active-line-bg` through the editor
  and gutter padding, so the row reads as one band across the whole control.
- c328259: Keep textarea gutter rows aligned with editor lines in vertical writing modes.
- f1433a9: `LineActionsOptions.createIcon` and `FoldingActionControllerOptions.createTriggerIcon`
  now accept any `Element`, so an icon can be a plain inline `<svg>` rather than an
  `HTMLElement` such as an icon custom element. Existing callbacks still type-check.
- 4617b45: Keep active-line and cursor tracking consistent when browsers expose a shadow-DOM selection
  through different selection APIs.
- 54067cc: Tab no longer traps keyboard focus in the editor. Escape followed by Tab moves focus to the next control, and Shift+Tab moves focus to the previous control instead of inserting a tab character.
- 57d6371: Size line-number gutter rows in local CSS pixels under zoom so wrapped and
  unwrapped lines stay aligned with their editor rows.
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

- 985067e: Allow `rc-textarea` to shrink below its intrinsic content width so `word-wrap`
  wraps long, unbroken lines inside narrow grid and flex layouts instead of
  forcing the consumer layout to overflow.
- 57370e4: Align component metadata, aggregate framework typings, development-time native-child
  validation, controlled menu state, package declarations, and public documentation before the
  next release.
- Updated dependencies [6683eb9]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
  - @rcarls/rc-common@0.6.0

## 0.5.0

### Minor Changes

- 689340c: Remove pre-1.0 deprecated APIs: the boolean `keyNavigation` option, `rc-disclosure.fragment`,
  `rc-textarea.listNumbers`, `rc-textarea.label`, and `decorationsFromHtml`.

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

- 46810f7: Render line breaks immediately when Enter is pressed at the end of an editable line, including virtual-keyboard `beforeinput` events.
- 32b1dc4: Allow gutter typography to be themed independently with `--rc-textarea-gutter-font-family`.
- c50d9e2: Document the `root`, `gutter`, `gutter-cells`, `editor-area`, and `editor` CSS
  parts, all public attributes, and the `--rc-textarea-gutter-padding-inline-end`
  custom property in the generated API reference.
- be4f0ae: Fix `defaultValue` so its HTML attribute is `default-value`, matching every
  other `default-*` attribute in the library. It previously had no kebab-case
  mapping, so `<rc-textarea default-value="...">` was silently ignored.
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

- aecba33: Fix cursor position tracking in WebKit, where a plain Range from `getRangeAt()` does not
  resolve inside `rc-textarea`'s open shadow root. This made every Enter press and
  virtual-keyboard paragraph insert land at the start of the value instead of the cursor. Fall
  back to `Selection.getComposedRanges()` when Chrome's non-standard `shadowRoot.getSelection()`
  isn't available.
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

- 808afe4: ### Fixed

  - Fix regression where the visible editor did not reflect `value` and `defaultValue` on first mount.
  - @rcarls/rc-common@0.3.1

## 0.3.0

### Added

- Add `parseDecorationsFromHtml` as the canonical HTML decoration helper.
- Add `rc-textarea` to `HTMLElementTagNameMap`.

### Changed

- Deprecate `decorationsFromHtml` in favor of `parseDecorationsFromHtml`.
- Rename internal Parchment blot classes and document helpers from `V2` to `RC`.
- Expand public JSDoc across the component and plugin APIs.
- Update package metadata, README intro, and docs links.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0
