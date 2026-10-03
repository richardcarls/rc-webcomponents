---
'@rcarls/rc-theme-material': patch
'@rcarls/rc-webcomponents': patch
---

Drop the inner focus ring from `rc-combobox` and `rc-select` when they are
composed as `rc-field` controls, since the field's label and active indicator
already show focus.
