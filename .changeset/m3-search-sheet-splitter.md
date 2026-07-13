---
'@rcarls/rc-search-bar': minor
'@rcarls/rc-splitter': minor
'@rcarls/rc-dialog': minor
'@rcarls/rc-common': patch
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
---

Add Material 3 search-view, fixed-pane splitter, dialog scrim, and resize enhancements.

`rc-search-bar` now supports `variant="view"`, controlled/default open state, search-view methods, a rich `suggestions` slot, and datalist-derived text suggestions. `rc-splitter` adds `mode="fixed"` for clampable pixel primary panes. `rc-common` now honors CSS max-size constraints during resize gestures, and `rc-dialog` exposes a scrim token plus resize handle/origin hooks used by themed surfaces.
