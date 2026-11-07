---
'@rcarls/rc-bottom-sheet': patch
'@rcarls/rc-webcomponents': patch
---

A handle drag that ends at its starting height no longer steps the sheet
on the click that follows it. The tap threshold now uses the largest
pointer displacement during the gesture, not the net height change.
