---
'@rcarls/rc-segmented-button': minor
'@rcarls/rc-theme-material': patch
'@rcarls/rc-theme-substrate': patch
'@rcarls/rc-theme-win31': patch
---

Move the segmented appearance into the component behind one switch.

Turning the native fieldset into a segmented control took 27 `--_rc-*`
declarations that every theme had to restate, 23 of them byte-identical. Two of
those blocks were accessibility recipes rather than taste: the visually hidden
legend that keeps the group's accessible name, and the hidden but focusable
radio. A theme that got either wrong removed the accessible name or made the
control unreachable by keyboard.

The component now owns the recipe and a theme sets
`--rc-segmented-button-appearance: segmented`. Four genuine theme choices become
public properties: `--rc-segmented-button-cursor`,
`--rc-segmented-button-disabled-cursor`,
`--rc-segmented-button-vertical-divider`, and
`--rc-segmented-button-selected-icon-display`.

Unset, the fieldset, legend, and radios keep their browser appearance, as
before. The switch is read with a style container query (Chrome 111, Safari 18,
Firefox 128); where that is unsupported the recipe does not apply and the
control falls back to the same native appearance.

To migrate a theme, replace its `--_rc-segmented-button-*` block with the single
`--rc-segmented-button-appearance: segmented` declaration, plus any of the four
public properties whose value differs from the default.
