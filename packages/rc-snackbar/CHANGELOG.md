# @rcarls/rc-snackbar

## 0.7.0

### Minor Changes

- 57338f5: `rc-dialog`, `rc-bottom-sheet`, and `rc-snackbar` now fade in and out through
  CSS alone, using `@starting-style` and a discrete `display`/`overlay`
  transition, driven by the shared `--rc-motion-effects-*` tokens (and
  `--rc-motion-spatial-*` for `rc-snackbar`'s slide). `showModal()`/`show()`/
  `close()` all stay synchronous, and nothing in any of the three components
  waits on the transition finishing, so a zero-duration theme or a browser
  without support for the CSS involved both degrade to an instant, fully
  correct open and close.

  `rc-dialog` and `rc-bottom-sheet` animate opacity only, not a scale or slide
  transform: both support pointer resize and read `getBoundingClientRect()` to
  compute drag deltas, and a transform is a visual effect that
  `getBoundingClientRect()` reports for as long as it's still animating,
  corrupting that measurement if a resize or drag starts during the entrance.
  `rc-snackbar` has no such feature, so it fades and slides up from the
  block-end edge it's anchored to.

### Patch Changes

- 5c006de: Ship component CSS minified. Package builds now run the CSS in Lit `css` styles
  and light-DOM structural styles through Lightning CSS, removing comments and
  whitespace while keeping source maps that resolve to each template. Rendered
  styles are unchanged.

  `@rcarls/rc-common` adds `cssText`, an identity tag that marks a plain CSS
  string for minification. `rc-chip`, `rc-disclosure`, and `rc-accordion` now
  depend on `@rcarls/rc-common` for it.

## 0.6.0

## 0.5.0

## 0.4.2

## 0.4.1

## 0.4.0

### Minor Changes

- 4171a9d: Give `open` proper controlled/uncontrolled backing (host writes are silent,
  new `default-open` attribute seeds initial visible state), matching every
  other stateful `open`/`value` property in the library. `show()`, `close()`,
  and `clear()` are unaffected.
- 985068e: Add the rc-snackbar package for queued live-region status messages.

### Patch Changes

- 55e8ab5: Preserve UA-like control and surface styling until an optional theme supplies decorative tokens.
  Restore themed button hover and pressed state layers, including a pointer-origin Material ripple.
