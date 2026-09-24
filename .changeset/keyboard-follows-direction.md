---
'@rcarls/rc-common': minor
'@rcarls/rc-menubar': patch
'@rcarls/rc-segmented-button': patch
'@rcarls/rc-transfer-list': patch
'@rcarls/rc-select': patch
'@rcarls/rc-combobox': patch
---

Arrow keys follow the reading direction everywhere. `keyNavigation` now also
flips the cross axis in RTL, so a vertical menu opens its submenu with
ArrowLeft, as the APG describes. A horizontal menubar and segmented button
advance with ArrowLeft in RTL, Alt+ArrowLeft moves items toward the selected
list of a transfer list in RTL, and the arrow toward the inline start reaches
the chips of a multiple select or combobox (ArrowRight in RTL).

Add `inlineArrowKeys(flow)` for content that runs along the inline axis, such
as chips or text.
