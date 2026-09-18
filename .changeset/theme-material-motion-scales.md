---
'@rcarls/rc-theme-material': minor
---

`rc-theme-material` now routes its component motion through the shared
spatial/effects token scale consistently. Previously, roughly thirty
`transition`/property declarations across combobox, listbox, menu, menu
button, menubar, select, range slider, search bar, app bar, textarea,
transfer list, toolbar, and splitter carried hardcoded `150ms ease` or
`200ms ease` literals instead of the theme's own motion tokens, and the
navigation bar/rail's active-item indicator (which resizes to the selected
item's box, a spatial change) was themed with a raw Material duration/easing
pair outside either scale. Every color/background-color/border-color/
box-shadow/opacity transition now uses `--rc-motion-effects-*`, and every
transform/scale/translate/inline-size/block-size transition uses
`--rc-motion-spatial-*`, splitting any declaration that mixed both kinds of
property. `rc-field`'s floating label transition moves its position/size
properties (`inset-block-start`, `font-size`) from the effects scale to the
spatial scale they actually belong to.

Five component motion tokens the theme previously left unset are now themed:
`--rc-switch-easing`, `--rc-button-state-layer-duration`,
`--rc-card-state-layer-duration`, `--rc-card-state-layer-easing`, and
`--rc-splitter-snap-duration`. `rc-switch`'s single duration/easing pair (it
has no separate spatial/effects knobs) now takes the spatial scale, since its
dominant motion, the thumb sliding and resizing, is spatial; this changes its
default transition speed under this theme from 150&nbsp;ms to 300&nbsp;ms.
`rc-splitter`'s snap-to-point animation moves from its 200&nbsp;ms component
default to the same 300&nbsp;ms spatial-fast tier for the same reason.

The spatial easing curves are now sourced from the semantic aliases added in
the last release rather than composed inline from raw control points four
times over. Material 3's spec spatial durations are
350/500/700&nbsp;ms; this theme's own motion guide finds durations past
roughly 400&nbsp;ms read as waiting rather than feedback, so the spatial
scale is compressed to 300/400/500&nbsp;ms: a deliberate, recorded departure
from the spec numbers, not the spec's `emphasized` curve shape, which is
unchanged.
