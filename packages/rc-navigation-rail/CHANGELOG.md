# @rcarls/rc-navigation-rail

## 0.4.2

### Patch Changes

- @rcarls/rc-common@0.4.2

## 0.4.1

### Patch Changes

- @rcarls/rc-common@0.4.1

## 0.4.0

### Minor Changes

- dce5749: Replace the navigation rail's shadow-DOM fallback toggle with a consumer-authored light-DOM
  button, and align collapsed and expanded item layouts across the default and reference themes.
- 4f77b8c: `rc-navigation-rail` no longer renders an internal `nav` landmark or exposes
  the `label` property and attribute, matching the fix already applied to
  `rc-navigation-bar`. Wrap it in a labeled native `<nav>` element instead.

  BREAKING CHANGE: remove the `label` property/attribute and stop rendering an
  internal `<nav aria-label>`; `rc-navigation-rail` now renders a plain `div`
  for its `nav` part and expects the consumer to own landmark semantics.

- ccca8e2: Add navigation bar and rail packages with shared active-indicator positioning.

### Patch Changes

- 3efe74a: Center navigation rail header content on the inline axis and remove Material
  elevation from FABs placed in the header slot.
- 6f91e7a: Fix collapsed `rc-navigation-rail` items so the whole item's box wraps icon and
  label, not just the icon. The shared component pulled the label out of flow
  (`position: absolute`), so a theme's whole-item background or focus ring only
  covered the icon; Material's detached-pill layout now lives in its own theme
  stylesheet instead of the shared base. Substrate's collapsed rail also grows
  from `5rem` to `6rem` so single-word labels like "Settings" stop wrapping.
- 55e8ab5: Preserve UA-like control and surface styling until an optional theme supplies decorative tokens.
  Restore themed button hover and pressed state layers, including a pointer-origin Material ripple.
- e95e204: Document the `label`, `expanded`, `default-expanded`, `active-selector`, and
  `indicator-target` attributes, document the previously-missing
  `--rc-navigation-rail-indicator-border` and
  `--rc-navigation-rail-item-text-decoration` custom properties, and correct
  `--rc-navigation-rail-indicator-bg`, `--rc-navigation-rail-indicator-radius`,
  `--rc-navigation-rail-indicator-duration`, `--rc-navigation-rail-focus-ring`,
  and `--rc-navigation-rail-active-color`, which documented values from the
  Material and Substrate theme recipes instead of the component's own base
  defaults.
- 8c567e0: Fix `expanded` so assigning `undefined` releases control back to
  `default-expanded`, matching the library's controlled/uncontrolled convention
  used by `rc-switch`'s `checked` and other value-like properties. It previously
  ignored `undefined` writes entirely, permanently locking the rail once
  `expanded` had been set once.
- e88eff8: Use the system link accent as the theme-free active-link fallback for navigation
  bar and rail destinations.
- Updated dependencies [e57277f]
- Updated dependencies [ccca8e2]
- Updated dependencies [037b1b3]
  - @rcarls/rc-common@0.4.0
