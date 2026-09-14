---
'@rcarls/rc-theme-material': minor
---

Theme `rc-select` and `rc-combobox` as `rc-field` control providers: resting, hover, and
focus/open chrome resets mirroring the existing `rc-textarea` treatment, so `rc-field`'s own
`#field` surface owns the visible border, background, and focus ring instead of the wrapped
control rendering its own on top. Standalone (non-wrapped) usage is unaffected; every new rule
is scoped to `[data-rc-field-control]`.
