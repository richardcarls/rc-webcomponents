# @rcarls/rc-field

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

- 19278d4: Group several native controls into one `rc-field` with a direct `<fieldset>`. Its `<legend>` names
  the group and shows as the field label, each control keeps its own accessible name, and supporting
  text describes the fieldset. The first text-like input or textarea is the primary control behind
  `control`, `focus()`, and `data-populated`; focus moving between grouped controls keeps the field
  focused; and `data-disabled`, `data-required`, and `data-invalid` reflect the whole group. New
  read-only `group` and `controls` properties and a `data-group` host attribute support the mode.

  The primary control grows and other controls attach before or after it. In Material, the legend uses
  the floating label mechanics: it rests on the input line while the group is idle and its primary
  input empty, and floats on focus or once that input has a value; a group with a control before its
  primary input keeps it floated. Grouped placeholders wait for focus. Substrate colors an invalid
  group's legend, and Win31 spaces it like a single field's label.

- 9ab269c: Support `<select>` as a field control, both as a plain direct child and wrapped by an
  enhancing control provider (the same contract `rc-textarea` already uses). Populated state for
  a multiple select comes from `selectedOptions` rather than `.value`, which only reflects the
  first selected option in tree order and can read empty even with a real selection.
- e23a39c: Add an accessible native input and textarea field wrapper with Material 3 filled and outlined
  theme treatments, including an explicit provider contract for enhanced native controls.

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
- c5b62c9: Fix an empty `leading`/`trailing`/`prefix`/`suffix` slot silently keeping its layout box (and any
  margin meant for the non-empty case), eating into the control's available width. The `.empty-slot`
  class could never win against the id-selector rule setting its `display`, regardless of source
  order.
- f4c0244: Prefer a control provider's own `disabled` property over its raw native control when both are
  present. A provider disabling its control for an internal reason unrelated to the field's real
  enabled/disabled intent (confirmed with `rc-select`'s GeckoView picker guard) no longer leaks
  into `data-disabled` and the field's dimmed styling.
- f6eea6f: Suppress Chromium's tap-highlight flash on the native control. Firefox has no
  equivalent behavior, so an unstyled control only flashed on Chrome despite the
  existing focus-outline reset.
- 77f9c63: Fix three theme gaps where a token fell through to a system color.

  **Substrate had no error color.** `--rc-field-error-color` fell through to `rc-field`'s own
  default of `Mark`, the system color for the background of highlighted text, which renders as
  pure yellow and measured 1.07:1 against the field. Validation worked, the message was in the
  accessibility tree, and it could not be read. Substrate now ships `--substrate-error`, held
  at hue 25 so it reads as red rather than as a darker shade of the orange primary at hue 48,
  and the bridge maps it. Both modes clear 7:1.

  Every remaining error fallback of `Mark`, in `rc-field` and in the Material field styles, now
  falls back to the validation red a user agent uses for an invalid control. The `Mark` usages
  inside `forced-colors` blocks are unchanged, where a system color is correct.

  **Material never set `--rc-button-text`.** `rc-select`, `rc-combobox`, and `rc-menu-button`
  read it directly for text drawn over `--rc-button-bg`, which Material sets to the primary
  fill, so the `ButtonText` fallback gave 3.26:1 in light and 1.70:1 in dark. It now follows
  `--md-sys-color-on-primary` alongside `--rc-button-color`, giving 6.44:1 and 7.71:1.

  **Substrate referenced three tokens it never declared.** `--substrate-inverse-surface`,
  `--substrate-inverse-on-surface`, and `--substrate-radius-pill` were used by the bridge and
  component styles but missing from `defaults.css`, leaving `rc-snackbar` on system colors and
  the bottom sheet handle on a literal. All three are declared, and a `defaults` test now
  asserts that every referenced token exists.

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
