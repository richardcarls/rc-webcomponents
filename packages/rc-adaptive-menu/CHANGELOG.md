# @rcarls/rc-adaptive-menu

## 0.6.0

### Minor Changes

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

- 7382c71: Add `--rc-adaptive-menu-touch-target-overlap-inline-start` and
  `-inline-end`, zero by default. A theme or consumer sets one to let the
  overflow trigger's accessible touch-target inflation on that side overlap
  into whatever sits just outside the host, such as a toolbar's own edge
  padding, instead of also reserving layout space there (the overflow
  trigger is conventionally the trailing-most control in a toolbar, so
  `-inline-end` is the one commonly set). Mirrors `@rcarls/rc-button`'s and
  `@rcarls/rc-menu-button`'s own touch-target overlap tokens.

### Patch Changes

- Updated dependencies [6683eb9]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
  - @rcarls/rc-common@0.6.0
