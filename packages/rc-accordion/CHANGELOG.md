# @rcarls/rc-accordion

## 0.7.0

### Minor Changes

- 4b9bfe6: Give `rc-disclosure` and `rc-accordion` a public styling contract.

  Both were styled by targeting the native `<details>` element directly, so neither exposed a
  single `--rc-*` property and no theme could change them without rewriting theme CSS. They now
  follow the light-DOM base pattern `rc-button` and `rc-listbox` already use: `rc-disclosure`
  installs one structural stylesheet per containing `Document` or `ShadowRoot`, in `@layer rc-base`
  behind a `data-rc-light-dom-base` sentinel, reading documented properties with UA-like defaults.

  One recipe covers both supported child forms, a bare `<details>` inside `rc-accordion` and one
  wrapped in `rc-disclosure`, so neither theme repeats the panel rules. `rc-accordion` owns only
  `--rc-accordion-gap`.

  Motion is opt-in. `--rc-disclosure-duration` defaults to `0ms`, so a disclosure with no theme keeps
  the platform's snap-open behavior, and the height animation runs on `::details-content` behind a
  `@supports selector()` check. This replaces Material's `60rem` `max-block-size` ceiling, which
  clipped content taller than the guess and made every non-summary child its own animation unit.

  **Fixes a missing expand affordance in the Material theme.** It set `display: grid` on the
  `<summary>` and then styled `summary::marker`. Any `display` other than `list-item` drops the
  marker box, so that rule styled nothing and the theme drew no replacement: a Material disclosure
  had no disclosure triangle at all. The base layer never sets `display` on a summary, so the
  marker survives. A theme may still change it, as Substrate does, but only alongside a
  replacement affordance.

### Patch Changes

- aee912a: Single-open accordions now close a sibling `rc-disclosure` through its native `<details>`
  instead of its `open` property. Writing the property switched the disclosure into
  controlled mode, so a panel the accordion had closed would not reopen from its summary.
  A controlled sibling now receives the close as an `rc-disclosure-toggle` request and
  keeps the state its owner sets.

  The Solid JSX types now declare `rc-disclosure`'s `default-open` attribute and its
  `open` and `defaultOpen` properties.

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
- Updated dependencies [4b9bfe6]
- Updated dependencies [3f19f57]
- Updated dependencies [51f6403]
- Updated dependencies [9caca6b]
- Updated dependencies [b764a3c]
- Updated dependencies [54d9ead]
- Updated dependencies [6e548d9]
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
  - @rcarls/rc-disclosure@0.7.0

## 0.6.0

### Patch Changes

- Updated dependencies [57370e4]
  - @rcarls/rc-disclosure@0.6.0

## 0.5.0

### Patch Changes

- Updated dependencies [689340c]
  - @rcarls/rc-disclosure@0.5.0

## 0.4.2

### Patch Changes

- Updated dependencies [b12bf1b]
  - @rcarls/rc-disclosure@0.4.2

## 0.4.1

### Patch Changes

- @rcarls/rc-disclosure@0.4.1

## 0.4.0

### Patch Changes

- 681a940: Document the `name` attribute, which mirrors onto managed native `<details>`
  elements for native details name-grouping, and normalize the `multiple` tag
  to the library's plain `@attr name - description` form.
- Updated dependencies [1161caa]
  - @rcarls/rc-disclosure@0.4.0

## 0.3.2

### Patch Changes

- @rcarls/rc-disclosure@0.3.2

## 0.3.1

### Patch Changes

- @rcarls/rc-disclosure@0.3.1

## 0.3.0

### Added

- Add direct child native `<details>` panel support.
- Add dynamic child syncing and `multiple` mode.

### Changed

- Update package metadata, README intro, and docs links.

### Dependencies

- Sync internal dependencies to 0.3.0.

## 0.2.0

### Patch Changes

- @rcarls/rc-disclosure@0.2.0
