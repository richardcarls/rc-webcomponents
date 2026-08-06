---
'@rcarls/rc-chip': patch
'@rcarls/rc-theme-material': patch
'@rcarls/rc-theme-substrate': patch
---

Use a zero default gap for tighter chip content layout and a smaller default
font size for slotted remove icons. Derive removable content padding from the
remove target width and chip gap so the label and trailing icon stay aligned.
