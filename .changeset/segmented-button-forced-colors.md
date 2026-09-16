---
'@rcarls/rc-segmented-button': patch
---

Keep the selected segment visible in forced-colors mode.

Forced colors replaces the background a theme selects a segment with, which left
selection legible only through the optional selected-icon slot. The base styles
now restate the selected segment in `Highlight` and `HighlightText`, matching the
`rc-chip` treatment, so selection survives in every theme whether or not the icon
slot is used.
