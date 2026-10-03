---
'@rcarls/rc-chip-group': patch
'@rcarls/rc-combobox': patch
'@rcarls/rc-select': patch
'@rcarls/rc-theme-material': patch
'@rcarls/rc-webcomponents': patch
---

Keep wrapped chip rows evenly spaced. Readonly chips in an `rc-chip-group`
keep the touch-target block size, so expanded rows share the disclosure
toggle's pitch. `rc-combobox` and `rc-select` return the chip touch-target
overlap tokens as row gap, so interior chip rows no longer collapse onto each
other inside a field. Material combobox and select input chips drop their
extra block padding to render at the 2rem chip height.
