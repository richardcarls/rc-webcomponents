---
'@rcarls/rc-app-bar': patch
'@rcarls/rc-combobox': patch
'@rcarls/rc-disclosure': patch
'@rcarls/rc-listbox': patch
'@rcarls/rc-menu': patch
'@rcarls/rc-menu-button': patch
'@rcarls/rc-select': patch
'@rcarls/rc-splitter': patch
'@rcarls/rc-textarea': patch
'@rcarls/rc-transfer-list': patch
---

Every custom event these elements dispatch is now declared in `HTMLElementEventMap`, so
`addEventListener('rc-select-change', ...)` and similar calls receive a typed `CustomEvent`.
`rc-menu`, `rc-splitter`, and `rc-textarea` export the detail types they were missing:
`RCMenuCloseEvent`, `RCSplitterChangeEvent`, `RCTextareaChangeEvent`, and
`RCTextareaSelectEvent`.
