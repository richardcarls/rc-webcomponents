# @rcarls/rc-combobox

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

- 4341311: Add reusable fullscreen dialogs and declarative dialog popup mode to `rc-select` and
  `rc-combobox`. Dialog selection and creation are staged until Done, while close and Escape
  discard the draft. Fullscreen surfaces follow the visual viewport under browser zoom and
  software keyboards, and anchored popups now clamp to the visual viewport.
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

- 687a9be: Add shared popup surface tokens: `--rc-popup-background`, `--rc-popup-color`,
  `--rc-popup-border`, `--rc-popup-radius`, `--rc-popup-shadow`, and
  `--rc-popup-padding-block`. Menus, adaptive-menu popups, and select and
  combobox listboxes read them before their own fallbacks. Themes set them at the
  theme root, so popups rendered inside other shadow roots keep the theme's
  surface. Select and combobox add `--rc-*-listbox-background` and
  `--rc-*-listbox-color`.

  Breaking: popup surfaces no longer fall back to `--rc-control-radius`. Set
  `--rc-popup-radius` (or the per-component radius token) to change popup
  corners. The Material, Substrate, and Win31 themes no longer set per-component
  popup surface tokens such as `--rc-menu-radius` or
  `--rc-adaptive-menu-popup-background`; override the `--rc-popup-*` tokens
  instead. Material select and combobox listboxes now use the menu container
  color, Material forced-colors popups gain a border, and Substrate listboxes use
  the menu shadow and padding. Material retains its two-layer adaptive-menu popup
  shadow through a component token while other popups continue using the shared
  shadow.

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

### Patch Changes

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

- 1179f24: Drop the `@oddbird/css-anchor-positioning` polyfill. Browsers without full
  native anchor positioning now use `AnchorController`'s script positioning,
  which applies the same placement and flip rules and re-positions when the page
  scrolls or the viewport, anchor, or floating element resizes. Those browsers no
  longer download the 41 kB polyfill the first time a popup opens.
- 3d050f1: Keep wrapped chip rows evenly spaced. Readonly chips in an `rc-chip-group`
  keep the touch-target block size, so expanded rows share the disclosure
  toggle's pitch. `rc-combobox` and `rc-select` return the chip touch-target
  overlap tokens as row gap, so interior chip rows no longer collapse onto each
  other inside a field. Material combobox and select input chips drop their
  extra block padding to render at the 2rem chip height.
- 595fe37: `rc-combobox` now falls back to text registered under `rc-select`, below
  its own `rc-combobox` text, so an app no longer registers the shared keys
  twice. `resolveMessages()` and `MessagesController` take an `inherit` scope
  for the same layering in other components: within each locale the
  component's own scope wins, a more specific locale wins over its base
  language, and only keys the component has defaults for are taken.
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

- 51f6403: Arrow keys follow the reading direction everywhere. `keyNavigation` now also
  flips the cross axis in RTL, so a vertical menu opens its submenu with
  ArrowLeft, as the APG describes. A horizontal menubar and segmented button
  advance with ArrowLeft in RTL, Alt+ArrowLeft moves items toward the selected
  list of a transfer list in RTL, and the arrow toward the inline start reaches
  the chips of a multiple select or combobox (ArrowRight in RTL).

  Add `inlineArrowKeys(flow)` for content that runs along the inline axis, such
  as chips or text.

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
- 8363cb8: Fix a real user-driven "create new option" selection not dispatching native `input`/`change` on
  the slotted `<select>` (`focus()`/`blur()` forwarding and `required` mirroring were already
  correct through inheritance from `rc-select`'s new control-provider support). `aria-required`
  now reflects on the input trigger.
- Updated dependencies [e3dfa59]
- Updated dependencies [50d5610]
- Updated dependencies [9ee769c]
- Updated dependencies [1179f24]
- Updated dependencies [9720b36]
- Updated dependencies [2934328]
- Updated dependencies [9059bce]
- Updated dependencies [3d050f1]
- Updated dependencies [595fe37]
- Updated dependencies [38cd00c]
- Updated dependencies [5c006de]
- Updated dependencies [079e025]
- Updated dependencies [a6553ff]
- Updated dependencies [2205478]
- Updated dependencies [ec6ebc6]
- Updated dependencies [4341311]
- Updated dependencies [899bb5e]
- Updated dependencies [25fcfe0]
- Updated dependencies [51f6403]
- Updated dependencies [9caca6b]
- Updated dependencies [b764a3c]
- Updated dependencies [cc0205d]
- Updated dependencies [54d9ead]
- Updated dependencies [94dc987]
- Updated dependencies [b9175e9]
- Updated dependencies [c8b762b]
- Updated dependencies [55e1e7f]
- Updated dependencies [f1ca82d]
- Updated dependencies [687a9be]
- Updated dependencies [3fe08cb]
- Updated dependencies [a86edce]
- Updated dependencies [b87f27b]
- Updated dependencies [32ebead]
- Updated dependencies [bfefedd]
- Updated dependencies [c130173]
- Updated dependencies [8a30e96]
- Updated dependencies [11680b6]
- Updated dependencies [223d36c]
- Updated dependencies [7b91a44]
- Updated dependencies [aa04ead]
- Updated dependencies [ac65b5b]
- Updated dependencies [f0d0fba]
- Updated dependencies [6d126fd]
- Updated dependencies [afcfef8]
- Updated dependencies [11ef1ad]
  - @rcarls/rc-common@0.7.0
  - @rcarls/rc-select@0.7.0
  - @rcarls/rc-chip-group@0.7.0
  - @rcarls/rc-listbox@0.7.0

## 0.6.0

### Minor Changes

- ffcbf11: Add adaptive chip-group layouts, native-backed filter chips, and shared
  input-chip rendering. Native-backed chips preserve controlled host state,
  follow form resets when uncontrolled, and accept native link actions. Groups
  restore author-owned chip variants when coordination ends. Keep search input
  chrome inside the search surface and align contextual icon sizes with Material 3.

### Patch Changes

- Updated dependencies [ffcbf11]
- Updated dependencies [6683eb9]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
  - @rcarls/rc-chip-group@0.6.0
  - @rcarls/rc-select@0.6.0
  - @rcarls/rc-common@0.6.0
  - @rcarls/rc-listbox@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [4ae2ef0]
- Updated dependencies [689340c]
  - @rcarls/rc-common@0.5.0
  - @rcarls/rc-listbox@0.5.0
  - @rcarls/rc-select@0.5.0

## 0.4.2

### Patch Changes

- @rcarls/rc-common@0.4.2
- @rcarls/rc-listbox@0.4.2
- @rcarls/rc-select@0.4.2

## 0.4.1

### Patch Changes

- @rcarls/rc-common@0.4.1
- @rcarls/rc-listbox@0.4.1
- @rcarls/rc-select@0.4.1

## 0.4.0

### Patch Changes

- acc913e: Document the `chips` and `listbox` CSS parts, the `filter-strategy` attribute, and the
  `--rc-combobox-chip-gap`, `--rc-combobox-chip-border`, `--rc-combobox-listbox-border`, and
  `--rc-combobox-shadow` custom properties in the generated API reference. Also correct the
  `allow-create` attribute tag to non-bracket form (it has a real settable `allowCreate`
  property) and fix stale README/docs prose that claimed a `default-value` HTML attribute exists
  for the inherited `defaultValue` property, which has no attribute mapping.
- fa9bed0: Fix the toggle button's size custom property so it is `--rc-combobox-toggle-size`, matching
  every other `--rc-combobox-*` token in the package. It previously reused rc-select's
  `--rc-select-toggle-indicator-size`, so setting `--rc-combobox-toggle-size` on `<rc-combobox>`
  silently did nothing.
- Updated dependencies [e57277f]
- Updated dependencies [8944083]
- Updated dependencies [ccca8e2]
- Updated dependencies [9c3bc6f]
- Updated dependencies [037b1b3]
  - @rcarls/rc-common@0.4.0
  - @rcarls/rc-listbox@0.4.0
  - @rcarls/rc-select@0.4.0

## 0.3.2

### Patch Changes

- Updated dependencies [88b4086]
  - @rcarls/rc-common@0.3.2
  - @rcarls/rc-select@0.3.2
  - @rcarls/rc-listbox@0.3.2

## 0.3.1

### Patch Changes

- @rcarls/rc-common@0.3.1
- @rcarls/rc-listbox@0.3.1
- @rcarls/rc-select@0.3.1

## 0.3.0

### Added

- Add typed action option support for `allow-create` flows.

### Changed

- Change the required native `<select>` child to the default slot.
- Normalize embedded listbox option styling around `--rc-listbox-*` custom properties.
- Replace the text chevron with an inline SVG chevron.
- Update package metadata, README intro, and docs links.

### Fixed

- Reflect `allowCreate` as the `allow-create` attribute instead of `allowcreate`.

### Migration

- Rename the `allowcreate` attribute to `allow-create`.

```diff
- <rc-combobox allowcreate>
+ <rc-combobox allow-create>
```

- Remove `slot="select"` from the native `<select>` child.

```diff
- <rc-combobox><select slot="select" name="tags">...</select></rc-combobox>
+ <rc-combobox><select name="tags">...</select></rc-combobox>
```

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0

### Patch Changes

- @rcarls/rc-common@0.2.0
- @rcarls/rc-listbox@0.2.0
- @rcarls/rc-select@0.2.0
