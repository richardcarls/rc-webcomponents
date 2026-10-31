---
'@rcarls/rc-theme-tailwind': minor
---

Adds `@rcarls/rc-theme-tailwind/layers.css`, a cascade layer order to import before Tailwind
and the theme. It keeps every `rc-*` layer above Tailwind's `base` layer, so Preflight resets
no longer override component structure (such as a modal dialog's centering), and below
`components` and `utilities`, so app classes still win.
