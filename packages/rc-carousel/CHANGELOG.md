# @rcarls/rc-carousel

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

- 40f9776: Add an APG carousel built on native CSS scroll snap, with optional navigation,
  pagination, mouse dragging, looping, and consumer-controlled slide sizing.
  Preserve controlled active-index behavior after rejected swipes, keep visual
  loop clones inert and out of forms, and degrade safely without intersection
  observation.

### Patch Changes

- e0de31d: Avoid scheduling a redundant carousel update during the initial Lit lifecycle
  while retaining initial pagination and dynamic slide synchronization.
- 7adbd76: Keep development diagnostics concise and prevent expected test fixtures from emitting noisy warnings.
- Updated dependencies [6683eb9]
- Updated dependencies [ee7ba6c]
- Updated dependencies [30eb232]
  - @rcarls/rc-common@0.6.0
