---
'@rcarls/rc-button': patch
'@rcarls/rc-webcomponents': patch
---

Keep a labeled button at least as wide as its label in content-sized layouts.
The slotted button clipped its content with `overflow: hidden`, which made it
a scroll container with a zero automatic minimum size, so a min-content table
column or an auto grid track could squeeze it narrower than its label. It now
clips with `overflow: clip`, which looks the same but keeps the label's width
as the button's minimum.
