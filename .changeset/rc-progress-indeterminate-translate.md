---
'@rcarls/rc-progress': patch
---

`rc-progress`'s indeterminate sweep now animates `translate` instead of
`inset-inline-start`, moving the animation onto the compositor instead of
forcing layout on every frame. `translate`'s percentages resolve against the
element's own box, not the track, and its direction is physical rather than
logical, so it does not flip for RTL the way `inset-inline-start` did on its
own; an internal custom property now carries that sign flip via `:dir(rtl)`,
verified to still sweep start-to-end in both writing directions.
