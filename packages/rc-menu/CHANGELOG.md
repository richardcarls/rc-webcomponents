# @rcarls/rc-menu

## 0.7.0

### Minor Changes

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

- 5c006de: Ship component CSS minified. Package builds now run the CSS in Lit `css` styles
  and light-DOM structural styles through Lightning CSS, removing comments and
  whitespace while keeping source maps that resolve to each template. Rendered
  styles are unchanged.

  `@rcarls/rc-common` adds `cssText`, an identity tag that marks a plain CSS
  string for minification. `rc-chip`, `rc-disclosure`, and `rc-accordion` now
  depend on `@rcarls/rc-common` for it.

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

- 30eb232: Add icon-only activation-area sizing and Material icon-button variants. Align menu
  selection and submenu affordances, and keep anchored popups within the viewport
  across native and fallback positioning.
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

- 3e89095: Replace rc-menu's generated submenu glyph with an author-supplied `indicator`
  slot on rc-menu-button. Keep the decorative indicator inside the trigger bounds,
  reserve label space for it, and expose theme-neutral size, color, and inset
  tokens for Material, Substrate, and application themes.

### Patch Changes

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

### Changed

- Normalize menu row styling around the light-DOM `rc-base` style contract.
- Update package metadata, README intro, and docs links.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0

### Patch Changes

- @rcarls/rc-common@0.2.0
