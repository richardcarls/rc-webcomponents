---
'@rcarls/rc-virtual-scroller': patch
---

Keep the rendered window on screen under CSS `zoom`, such as an app-wide
interface size set on the root. The view position, scrollport size, and line
pitch were read in viewport pixels but the spacers were written in the host's
own CSS pixels, so the window drifted off screen by the zoom error as the list
scrolled, leaving a growing blank gap. All geometry is now converted to host
pixels, and `scrollToIndex()` scrolls in the scroll container's own pixels.
