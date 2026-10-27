# @rcarls/rc-toolbar

## 0.7.0

### Minor Changes

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

- 57370e4: Align component metadata, aggregate framework typings, development-time native-child
  validation, controlled menu state, package declarations, and public documentation before the
  next release.
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

- 74d9046: Add native button-based chip controls and let toolbars coordinate groups of
  interactive chips with roving focus.

### Patch Changes

- b7270df: Compose the Markdown editor toolbar from `rc-toolbar`, `rc-button`, and
  `rc-select`, and include native buttons inside direct `rc-button` wrappers in
  toolbar roving-focus navigation.
- 4df89fd: Document the `label` and `orientation` attributes in the class JSDoc so the
  generated ApiTable's attributes section is no longer empty.
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

- Update package metadata, README intro, and docs links.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0

### Patch Changes

- @rcarls/rc-common@0.2.0
