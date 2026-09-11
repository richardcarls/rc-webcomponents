# @rcarls/rc-card

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
