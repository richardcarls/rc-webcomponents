---
'@rcarls/rc-common': patch
---

Preserve an element's rendered position when pinning its box inside a scrolled,
zoomed containing block. Scroll offsets and border widths are already local CSS
pixels, so only viewport measurements need zoom conversion.
On browsers without `currentCSSZoom`, derive the effective zoom from computed
styles so resize and placement stay aligned.
