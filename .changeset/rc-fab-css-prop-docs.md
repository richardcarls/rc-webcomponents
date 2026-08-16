---
'@rcarls/rc-fab': patch
---

Fix `rc-fab`'s CSS custom property documentation to match the component's
actual `revert`/unset fallbacks (background, color, radius, shadow, size,
gap, padding, font, focus-ring, and transition properties all defer to the
native button or a packaged theme, not the previously documented literal
defaults), and document `position`, `scroll-reveal`, and the computed
`scroll-below-threshold` attribute.
