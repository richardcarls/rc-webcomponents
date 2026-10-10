---
'@rcarls/rc-bottom-sheet': patch
'@rcarls/rc-webcomponents': patch
---

Keep `rc-bottom-sheet` docked at its block-end edge. Snapping now sets only
the sheet's height and leaves its position to CSS, releasing the edge pins a
drag gesture leaves inline. A viewport resize, such as a software keyboard
opening under `interactive-widget=resizes-content`, or a containing block that
moves after a snap no longer strands the sheet off-screen. A field that takes
focus inside the sheet is scrolled into view within the sheet, and the sheet
grows past its snap height and maximum block size only when scrolling cannot
reveal the field, returning to its snap point when focus leaves. A drag now
interrupts a running snap animation instead of being overridden by it.
