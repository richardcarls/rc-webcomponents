---
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': patch
---

`rc-theme-material` now declares the Material 3 motion system's seven named
easing curves (`--md-sys-motion-easing-standard`, `-emphasized`, and their
decelerate/accelerate variants, plus `-linear`) and sixteen named duration
bands (`--md-sys-motion-duration-short1` through `-extra-long4`), composed
from the control points and millisecond primitives already vendored. Several
component recipes were already reaching for these names with an inline
fallback (`var(--md-sys-motion-easing-standard, cubic-bezier(0.2, 0, 0, 1))`)
that silently won every time because nothing declared the token; those
references now resolve for real, and the fallback silently carrying a
Material 2 curve (`cubic-bezier(0.4, 0, 0.2, 1)`, in `rc-state-layer`'s
transition) is fixed to the correct Material 3 curve. Two more vendored-token
gaps of the same shape are fixed alongside: Material's disabled state-layer
and container opacity tokens, referenced across a dozen component recipes
with no local declaration, and two Substrate token names
(`--substrate-border`, `--substrate-radius-medium`) that never matched their
real declarations (`--substrate-border-color`, `--substrate-radius-md`) and
so always fell back to a hardcoded literal instead of the theme's actual
values; `rc-fab-menu`'s Substrate shadow tokens are corrected the same way.
