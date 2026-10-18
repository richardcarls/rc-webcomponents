---
'@rcarls/rc-common': patch
'@rcarls/rc-popover': patch
'@rcarls/rc-tooltip': patch
'@rcarls/rc-select': patch
'@rcarls/rc-combobox': patch
'@rcarls/rc-menu-button': patch
'@rcarls/rc-adaptive-menu': patch
---

Drop the `@oddbird/css-anchor-positioning` polyfill. Browsers without full
native anchor positioning now use `AnchorController`'s script positioning,
which applies the same placement and flip rules and re-positions when the page
scrolls or the viewport, anchor, or floating element resizes. Those browsers no
longer download the 41 kB polyfill the first time a popup opens.
