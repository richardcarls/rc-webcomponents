# @rcarls/rc-list

## 0.6.0

### Minor Changes

- b639e04: Add coordinated list and list-item layout tokens so container queries can
  stack unchanged content regions while preserving shared subgrid alignment.

  Breaking for the pre-1.0 carousel API: remove the redundant
  `variant="hero|multi-browse"` attribute and property. The variant only
  changed slide geometry, which is already controlled by
  `--rc-carousel-slide-size`. Remove `variant="hero"` without replacement;
  replace `variant="multi-browse"` with
  `--rc-carousel-slide-size: min(75%, 300px)`.

- a108336: Add shared-column `rc-list` and `rc-list-item` elements with standard and
  segmented appearances, default content truncation, and native-backed single or
  multiple selection coordination. Restore author-owned item state when native
  selection coordination ends.
- 6683eb9: Add shared, lifecycle-safe click delegation and let interactive list items
  forward plain surface clicks to same-root native action targets while
  preserving nested and modified clicks.

### Patch Changes

- a108336: Warn in development when `rc-card`/`rc-list-item` has `interactive` set but
  no way to resolve a click target: no `action-target`, and for
  `rc-list-item`, no native child checkbox/radio either. Surface clicks
  silently go nowhere in that state; the warning now says so at the point
  the row or card is set up wrong, instead of leaving it to be discovered
  by a user tapping a dead row or card.
- 7382c71: Add a priority-aware action toolbar that moves original controls into an
  overflow menu. Which actions are promoted is a purely declarative computation
  from `max-shown` and each action's `data-priority`/authored `slot`, with no
  runtime measurement of the toolbar's or its children's rendered size: a
  consumer whose promoted count needs to react to available space owns that
  decision and writes the resulting `max-shown` value down. Include controlled
  and uncontrolled open state, keyboard navigation, light dismissal, and a
  non-Popover fallback.

  Fix `--rc-adaptive-menu-touch-target-overlap-inline-start`/`-end`: the host's
  own `max-inline-size: 100%` self-referenced a shrink-to-fit ancestor's
  already-margin-reduced auto size (an app bar's own trailing group, for
  example), quietly clamping the host back down and canceling the overlap out
  from under it. The cap now grows by the overlap amount so it only ever bounds
  the host's real content.

- 57370e4: Align component metadata, aggregate framework typings, development-time native-child
  validation, controlled menu state, package declarations, and public documentation before the
  next release.
- Updated dependencies [6683eb9]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
  - @rcarls/rc-common@0.6.0
