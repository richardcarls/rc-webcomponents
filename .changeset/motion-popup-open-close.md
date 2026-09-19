---
'@rcarls/rc-menu-button': minor
'@rcarls/rc-select': minor
'@rcarls/rc-combobox': minor
'@rcarls/rc-fab-menu': minor
---

`rc-menu-button`'s, `rc-select`'s, and `rc-combobox`'s popup/listbox now fade
in and out through CSS alone, using `@starting-style` and a discrete
`display`/`overlay` transition, driven by new `--rc-menu-button-popup-duration`,
`--rc-select-listbox-duration`, and `--rc-combobox-listbox-duration`
properties. `showPopover()`/`hidePopover()` (via `openPopup()`/`closePopup()`)
stay synchronous, and nothing waits on the transition finishing.

These animate opacity only, not a scale or slide transform: all three
position their popup with the shared `AnchorController`, which applies its
own viewport-clamping `translate` and reads `getBoundingClientRect()` to
compute the next correction. A second, CSS-driven transform on the same
element and property would fight that positioning math on every open, not
only during an edge case.

`rc-fab-menu` already had a scale-based entrance for its popup (verified safe
here: unlike the general `AnchorController` case, this popup isn't
collision-clamped), but no exit animation at all and no directional easing.
Both are added: the popup now fades and scales back out on close, and enter
uses a decelerating curve while exit uses an accelerating one.
