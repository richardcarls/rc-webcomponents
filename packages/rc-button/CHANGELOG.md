# @rcarls/rc-button

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
