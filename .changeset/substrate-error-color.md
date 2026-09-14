---
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-theme-material': patch
'@rcarls/rc-field': patch
---

Give Substrate an error color and stop falling back to `Mark`.

Substrate set no error color, so `--rc-field-error-color` fell through to `rc-field`'s own
default of `Mark`. `Mark` is the system color for the background of highlighted text and
renders as pure yellow, which measured 1.07:1 against the field: validation worked, the
message was in the accessibility tree, and it could not be read.

Substrate now ships `--substrate-error`, held at hue 25 so it reads as red rather than as a
darker shade of the orange primary at hue 48, and the bridge maps it to
`--rc-field-error-color`. Both modes clear 7:1 against the field.

Every remaining `Mark` fallback for an error color, in `rc-field` and in the Material
field styles, now falls back to the validation red a user agent uses for an invalid
control. The `Mark` usages inside `forced-colors` blocks are unchanged, where a system
color is the correct thing to use.
