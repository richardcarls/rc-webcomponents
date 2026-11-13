---
'@rcarls/rc-field': patch
---

A focused text input in `rc-field` now sets `touch-action: pan-x pinch-zoom`, so a long press can
select its value in Firefox for Android. Firefox skips long-press word selection wherever the touch
could pan vertically, which inside a scrolling page includes every text field. While the input is
focused, a drag that starts on it no longer scrolls the page. Textareas, checkboxes, radios, and
range inputs keep their default panning.
