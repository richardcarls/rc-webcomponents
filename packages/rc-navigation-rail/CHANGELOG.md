# @rcarls/rc-navigation-rail

## 0.7.0

### Patch Changes

- 38cd00c: Convert viewport measurements to local CSS pixels when reordering items,
  positioning navigation indicators, and clamping anchored popups under CSS zoom.
  Reorder previews now account for the scroll container's zoom, while anchor
  corrections settle without repeated overshoot.
- 5c006de: Ship component CSS minified. Package builds now run the CSS in Lit `css` styles
  and light-DOM structural styles through Lightning CSS, removing comments and
  whitespace while keeping source maps that resolve to each template. Rendered
  styles are unchanged.

  `@rcarls/rc-common` adds `cssText`, an identity tag that marks a plain CSS
  string for minification. `rc-chip`, `rc-disclosure`, and `rc-accordion` now
  depend on `@rcarls/rc-common` for it.

- b9175e9: Position the navigation indicator in logical coordinates, so it lands on the
  current link in RTL and in vertical writing modes instead of mirroring to
  the opposite side or swapping its width and height.

  Add `physicalOffset`, the inverse of `logicalRect`: it turns a logical
  offset from the start corner into the physical `translate` an element
  anchored at `inset-inline-start`/`inset-block-start` needs.

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
