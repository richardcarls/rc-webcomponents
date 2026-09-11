# @rcarls/rc-scroller

## 0.6.0

### Minor Changes

- d67efde: Add a native-host scroll region with optional centered content and fullbleed
  layout tracks, aggregate framework typings, RTL-aware boundary state, and
  Material layout defaults.
- d67efde: Add reflected `at-block-start`, `at-block-end`, `at-inline-start`, and
  `at-inline-end` attributes, tracking whether the scroller is at each edge
  on its enabled axes. Lets a consumer drive an edge-fade, shadow, or other
  affordance from outside the shadow root without hand-rolling a scroll
  listener and ResizeObserver.

### Patch Changes

- 7adbd76: Keep development diagnostics concise and prevent expected test fixtures from emitting noisy warnings.
