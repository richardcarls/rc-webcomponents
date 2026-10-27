# @rcarls/rc-adaptive-menu

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

- 6d126fd: Add shared item type tokens: `--rc-item-font-family`, `--rc-item-font-size`,
  `--rc-item-font-weight`, `--rc-item-line-height`, `--rc-item-letter-spacing`,
  and `--rc-item-icon-size`. Menu, listbox, and adaptive-menu items read them.
  Adaptive menu adds `--rc-adaptive-menu-trigger-hover-background`,
  `--rc-adaptive-menu-trigger-shadow`, and
  `--rc-adaptive-menu-trigger-active-shadow`, and styles overflowed `rc-button`
  and `rc-menu-button` rows from its item tokens. Themes declare their menu,
  adaptive-menu, and item tokens on the theme root, so menus inside other shadow
  roots match menus in the document. Substrate's adaptive-menu trigger now shows
  its hover background.

  Breaking: theme menu and adaptive-menu tokens are inherited from the theme root
  instead of set on each element, so a value set on an ancestor now reaches
  nested menus. Material sets menu, listbox, and adaptive-menu item type through
  `--rc-item-*` instead of per-component rules; override those tokens to change
  item type. Themes no longer style the adaptive-menu trigger through
  `::part(overflow-trigger)` hover and pressed rules; use the new trigger tokens.

### Patch Changes

- 51aac05: `rc-adaptive-menu` no longer throws when actions are added while its first render is still
  pending. The action observer tried to give the overflow trigger a tab stop before the shadow
  tree existed; changes before the first render are now left to the initial sync.
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

- 7382c71: Add `--rc-adaptive-menu-touch-target-overlap-inline-start` and
  `-inline-end`, zero by default. A theme or consumer sets one to let the
  overflow trigger's accessible touch-target inflation on that side overlap
  into whatever sits just outside the host, such as a toolbar's own edge
  padding, instead of also reserving layout space there (the overflow
  trigger is conventionally the trailing-most control in a toolbar, so
  `-inline-end` is the one commonly set). Mirrors `@rcarls/rc-button`'s and
  `@rcarls/rc-menu-button`'s own touch-target overlap tokens.

### Patch Changes

- Updated dependencies [6683eb9]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
  - @rcarls/rc-common@0.6.0
