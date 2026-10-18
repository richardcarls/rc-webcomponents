---
'@rcarls/rc-popover': patch
'@rcarls/rc-tooltip': patch
'@rcarls/rc-theme-material': patch
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-webcomponents': patch
---

Theme popovers and tooltips through the shared token layers. `rc-popover` now
reads the shared `--rc-popup-*` surface tokens before its own fallbacks, like
menus and listboxes, and `rc-tooltip` takes its default corner from
`--rc-radius-sm`. The Material theme sets its popover and tooltip tokens on the
theme root, so surfaces inside other shadow roots inherit them, and the
Substrate theme adds popover and tooltip styles.
