---
'@rcarls/rc-field': minor
'@rcarls/rc-textarea': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-tailwind': minor
'@rcarls/rc-theme-win31': minor
---

**Breaking:** `rc-field` no longer writes `data-*` state attributes on its host.
Computed state is now a custom state: `:state(focused)`, `:state(populated)`,
`:state(disabled)`, `:state(readonly)`, `:state(invalid)`, and
`:state(multiline)`. `data-required` and `data-validation-attempted` are removed.
`rc-textarea` exposes `:state(readonly)` in place of `data-readonly`.

Migration:

- Replace `rc-field[data-focused]` with `rc-field:state(focused)`, and likewise
  for the other computed states.
- Replace `[data-has-label]` with `:has(> [slot='label'])`, `[data-group]` with
  `:has(> fieldset)`, and `[data-control-provider]` with
  `:has(> :is([data-rc-field-control], rc-select, rc-combobox, rc-textarea))`.
- Select a required control with `rc-field:has(:required)`, and an attempted
  invalid control with `:user-invalid`.
