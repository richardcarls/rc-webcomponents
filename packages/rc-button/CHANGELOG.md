# @rcarls/rc-button

## 0.7.0

### Patch Changes

- 9f590f2: Keep a labeled button at least as wide as its label in content-sized layouts.
  The slotted button clipped its content with `overflow: hidden`, which made it
  a scroll container with a zero automatic minimum size, so a min-content table
  column or an auto grid track could squeeze it narrower than its label. It now
  clips with `overflow: clip`, which looks the same but keeps the label's width
  as the button's minimum.
- fbf240b: Place pointer ripples in the state layer's local CSS pixels under zoom, using
  logical coordinates so the origin also follows RTL layout.
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

### Minor Changes

- 30eb232: Add icon-only activation-area sizing and Material icon-button variants. Align menu
  selection and submenu affordances, and keep anchored popups within the viewport
  across native and fallback positioning.
- 53baa54: Support a direct native `<a href>` child, styled the same as a `<button>`
  child (border, padding, background, `full-width`), for a real navigation
  action styled as a button, without losing native link affordances (open in
  new tab, copy link). `icon-only` sizing, the touch-target hit-slop, and the
  `disabled`/`pending`/`progress` states stay button-only: those assume a real
  `HTMLButtonElement`.

  Treat that anchor as a valid direct child in development validation as well as
  styling and documentation.

- 53baa54: Add `--rc-button-touch-target-overlap-inline-start` and
  `--rc-button-touch-target-overlap-inline-end` for `icon-only` buttons, zero
  by default. A theme or consumer sets one to let the accessible touch-target
  inflation on that side overlap into whatever sits just outside the host,
  such as a toolbar's own edge padding, instead of also reserving layout
  space there: the visible icon shifts flush with that edge while the
  invisible hit region keeps its full accessible size.

### Patch Changes

- 7adbd76: Keep development diagnostics concise and prevent expected test fixtures from emitting noisy warnings.

## 0.5.0

## 0.4.2

## 0.4.1

## 0.4.0

### Minor Changes

- 5312d29: Disable native buttons while pending or progressing, add determinate progress percentages, and
  support controlled and uncontrolled APG toggle buttons with selected icon switching.
- e11c4b7: Add the rc-button package for native button enhancement.

### Patch Changes

- 51b2c8f: Prevent pending and progress states from repeatedly writing the native button's disabled state.
- 55e8ab5: Preserve UA-like control and surface styling until an optional theme supplies decorative tokens.
  Restore themed button hover and pressed state layers, including a pointer-origin Material ripple.
- f1b38b5: Document all `rc-button` CSS custom properties and the `has-icon`,
  `has-selected-icon`, and `has-label` reflected attributes.
