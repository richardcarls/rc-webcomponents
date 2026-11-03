# @rcarls/rc-card

## 0.7.0

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

### Minor Changes

- f099b02: Add declarative horizontal cards with a two-fifths media column and symmetric
  row and column grid coordination properties.

### Patch Changes

- a108336: Warn in development when `rc-card`/`rc-list-item` has `interactive` set but
  no way to resolve a click target: no `action-target`, and for
  `rc-list-item`, no native child checkbox/radio either. Surface clicks
  silently go nowhere in that state; the warning now says so at the point
  the row or card is set up wrong, instead of leaving it to be discovered
  by a user tapping a dead row or card.
- 6683eb9: Add shared, lifecycle-safe click delegation and let interactive list items
  forward plain surface clicks to same-root native action targets while
  preserving nested and modified clicks.
- Updated dependencies [6683eb9]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
  - @rcarls/rc-common@0.6.0

## 0.5.0

## 0.4.2

## 0.4.1

## 0.4.0

### Minor Changes

- f36cd09: Add the rc-card package for neutral structural card surfaces.

### Patch Changes

- 55e8ab5: Preserve UA-like control and surface styling until an optional theme supplies decorative tokens.
  Restore themed button hover and pressed state layers, including a pointer-origin Material ripple.
- 000283d: Document the `selected`, `disabled`, `interactive`, and `has-*` slot-presence
  attributes and all `rc-card` CSS custom properties in the generated API
  reference.
