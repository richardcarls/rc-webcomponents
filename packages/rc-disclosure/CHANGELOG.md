# @rcarls/rc-disclosure

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

- 6e548d9: Several components handle `prefers-reduced-motion: reduce` in their own
  shadow styles, outside a theme's reach, and refine it the same way the theme
  layer already does: spatial motion (`translate`, `scale`, `transform`,
  `inline-size`, `block-size`) goes fully to zero, while effects motion (color,
  opacity) shortens instead of disappearing.

  `rc-app-bar` zeros its host's hide/show `translate` but shortens the
  expanded title's fade-in. `rc-disclosure` keeps its panel's expand/collapse
  zeroed, but its summary/content backstop for a theme-added transition now
  shortens instead of zeroing it outright. `rc-list-item`'s row and
  state-layer transition only color and opacity, so the whole sweep shortens.
  `rc-fab-menu`'s popup mixes `scale` with opacity/overlay/display under one
  shared duration; reduced motion now zeros the scale and shortens the rest.
  `rc-switch`'s thumb mixes background-color with inline-size/block-size/
  transform the same way; the icons and track, which each transition only one
  kind of property, needed only the zero-or-shorten call. `rc-fab`'s
  scroll-reveal is opacity/visibility only with no time-based duration to
  shorten in its scroll-linked path, so reduced motion narrows the scroll
  window instead of collapsing it to zero; its JS-transition fallback path
  shortens the same fade rather than removing it. `rc-progress`'s determinate
  fill transition, previously unguarded under reduced motion, is now zeroed;
  its indeterminate loop, a continuous sweep with no meaningful shortened
  form, stays fully stopped rather than shortened.

### Patch Changes

- 5c006de: Ship component CSS minified. Package builds now run the CSS in Lit `css` styles
  and light-DOM structural styles through Lightning CSS, removing comments and
  whitespace while keeping source maps that resolve to each template. Rendered
  styles are unchanged.

  `@rcarls/rc-common` adds `cssText`, an identity tag that marks a plain CSS
  string for minification. `rc-chip`, `rc-disclosure`, and `rc-accordion` now
  depend on `@rcarls/rc-common` for it.

- 3f19f57: Disclosure summaries draw their hover layer only for a pointer that can hover, so a tapped
  summary no longer stays highlighted on touch screens. The Material theme also spaces disclosure
  content from its summary.
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

- 57370e4: Add `defaultOpen` and `default-open` for uncontrolled disclosure state. Host writes to `open`
  now establish controlled mode, user toggles report the requested state without overriding the
  host value, and assigning `undefined` releases control.

## 0.5.0

### Minor Changes

- 689340c: Remove pre-1.0 deprecated APIs: the boolean `keyNavigation` option, `rc-disclosure.fragment`,
  `rc-textarea.listNumbers`, `rc-textarea.label`, and `decorationsFromHtml`.

## 0.4.2

### Patch Changes

- b12bf1b: Fix `rc-disclosure` silently discarding an initial `<details open>` on connect.
  `_setupDetails()` always synced the wrapped `<details>`'s open state from the host's own
  `open` attribute, defaulting to closed whenever the host had no explicit `open` of its
  own, even if the `<details>` markup said otherwise. Plain `<details open>` inside
  `<rc-disclosure>` (no `open` on the host) now opens as expected, and the host adopts that
  state instead of defaulting to closed. The host's own `open` attribute still wins whenever
  it's set explicitly.

## 0.4.1

## 0.4.0

### Patch Changes

- 1161caa: Document the `open` and deprecated `fragment` attributes, and give the
  deprecated `fragment` accessor a real summary line instead of only
  `@deprecated` text, so the generated API reference shows a description
  instead of a blank one.

## 0.3.2

## 0.3.1

## 0.3.0

### Changed

- Open and scroll automatically when the URL hash targets content inside the disclosure.
- Deprecate the `fragment` attribute; fragment targeting is now always enabled.
- Update package metadata, README intro, and docs links.

### Migration

- Remove `fragment`; it no longer changes behavior.

## 0.2.0
