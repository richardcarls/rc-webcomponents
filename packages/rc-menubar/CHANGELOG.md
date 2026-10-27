# @rcarls/rc-menubar

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

- 51f6403: Arrow keys follow the reading direction everywhere. `keyNavigation` now also
  flips the cross axis in RTL, so a vertical menu opens its submenu with
  ArrowLeft, as the APG describes. A horizontal menubar and segmented button
  advance with ArrowLeft in RTL, Alt+ArrowLeft moves items toward the selected
  list of a transfer list in RTL, and the arrow toward the inline start reaches
  the chips of a multiple select or combobox (ArrowRight in RTL).

  Add `inlineArrowKeys(flow)` for content that runs along the inline axis, such
  as chips or text.

- 253ba66: Correct package dependency declarations and prevent bundled Markdown implementation types from
  leaking into the editor declarations.

  BREAKING CHANGE: `@rcarls/rc-textarea-adapters` now treats `@rcarls/rc-textarea` as a peer instead
  of installing it as a runtime dependency. Both textarea extension packages require a compatible
  pre-1 `@rcarls/rc-textarea` release; install it alongside either extension package when upgrading.

- 11680b6: Expose and navigate the orientation a widget actually renders in. An
  `orientation` attribute names a layout: `horizontal` runs along the inline
  axis and `vertical` along the block axis, so both turn over in vertical
  writing modes, the way a native `<input type="range">` does. Toolbar,
  menubar, and adaptive menu now report the rendered orientation as
  `aria-orientation`, and their arrow keys follow it, so a horizontal toolbar
  in vertical text navigates with ArrowDown.

  `keyNavigation` treats an explicit `navigationAxis` and role defaults as
  layout orientations and converts them the same way; an explicit
  `aria-orientation` attribute is still used as is. Add `renderedOrientation`
  and a `FlowController` that keeps a host's writing mode and direction current
  for rendering.

  `rc-toolbar` now reflects `orientation` to its host attribute, and its
  vertical layout is keyed off that attribute rather than `aria-orientation`.

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
- Updated dependencies [afcfef8]
- Updated dependencies [11ef1ad]
  - @rcarls/rc-common@0.7.0
  - @rcarls/rc-menu-button@0.7.0

## 0.6.0

### Patch Changes

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

### Patch Changes

- 1ba0be2: Document the `label` and `orientation` attributes in the class JSDoc, and fix
  the package README's read-only getters and `focusItem()` signature to use the
  `$`-prefixed names the component has shipped for some time (`$items`,
  `$menuButtons`, `$firstItem`, `$lastItem`, `$nextItem`, `$previousItem`).
- Updated dependencies [e57277f]
- Updated dependencies [69e31c1]
- Updated dependencies [4cb5551]
- Updated dependencies [ccca8e2]
- Updated dependencies [037b1b3]
- Updated dependencies [3e89095]
  - @rcarls/rc-common@0.4.0
  - @rcarls/rc-menu-button@0.4.0
  - @rcarls/rc-menu@0.4.0

## 0.3.2

### Patch Changes

- Updated dependencies [88b4086]
  - @rcarls/rc-common@0.3.2
  - @rcarls/rc-menu@0.3.2
  - @rcarls/rc-menu-button@0.3.2

## 0.3.1

### Patch Changes

- @rcarls/rc-common@0.3.1
- @rcarls/rc-menu@0.3.1
- @rcarls/rc-menu-button@0.3.1

## 0.3.0

### Changed

- Configure child menu-button triggers through a flat inherited token contract.
- Update package metadata, README intro, and docs links.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0

### Patch Changes

- @rcarls/rc-common@0.2.0
- @rcarls/rc-menu@0.2.0
- @rcarls/rc-menu-button@0.2.0
