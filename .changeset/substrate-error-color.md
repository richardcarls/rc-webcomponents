---
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-material': patch
'@rcarls/rc-field': patch
---

Fix three theme gaps where a token fell through to a system color.

**Substrate had no error color.** `--rc-field-error-color` fell through to `rc-field`'s own
default of `Mark`, the system color for the background of highlighted text, which renders as
pure yellow and measured 1.07:1 against the field. Validation worked, the message was in the
accessibility tree, and it could not be read. Substrate now ships `--substrate-error`, held
at hue 25 so it reads as red rather than as a darker shade of the orange primary at hue 48,
and the bridge maps it. Both modes clear 7:1.

Every remaining error fallback of `Mark`, in `rc-field` and in the Material field styles, now
falls back to the validation red a user agent uses for an invalid control. The `Mark` usages
inside `forced-colors` blocks are unchanged, where a system color is correct.

**Material never set `--rc-button-text`.** `rc-select`, `rc-combobox`, and `rc-menu-button`
read it directly for text drawn over `--rc-button-bg`, which Material sets to the primary
fill, so the `ButtonText` fallback gave 3.26:1 in light and 1.70:1 in dark. It now follows
`--md-sys-color-on-primary` alongside `--rc-button-color`, giving 6.44:1 and 7.71:1.

**Substrate referenced three tokens it never declared.** `--substrate-inverse-surface`,
`--substrate-inverse-on-surface`, and `--substrate-radius-pill` were used by the bridge and
component styles but missing from `defaults.css`, leaving `rc-snackbar` on system colors and
the bottom sheet handle on a literal. All three are declared, and a `defaults` test now
asserts that every referenced token exists.
