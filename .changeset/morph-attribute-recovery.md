---
'@rcarls/rc-common': minor
'@rcarls/rc-app-bar': patch
'@rcarls/rc-button': patch
'@rcarls/rc-card': patch
'@rcarls/rc-carousel': patch
'@rcarls/rc-chip-group': patch
'@rcarls/rc-data-table': patch
'@rcarls/rc-field': patch
'@rcarls/rc-list': patch
'@rcarls/rc-listbox': patch
'@rcarls/rc-menu': patch
'@rcarls/rc-menu-button': patch
'@rcarls/rc-menubar': patch
'@rcarls/rc-page-turner': patch
'@rcarls/rc-popover': patch
'@rcarls/rc-range-slider': patch
'@rcarls/rc-search-bar': patch
'@rcarls/rc-textarea': patch
'@rcarls/rc-toolbar': patch
'@rcarls/rc-transfer-list': patch
'@rcarls/rc-virtual-canvas': patch
---

Elements write their attributes again after a DOM morph removes them. Turbo
page refreshes, Livewire, htmx, and Blazor enhanced navigation diff the live DOM
against server markup, which removed each element's default `role`,
`tabindex`, ARIA state on native children, state attributes such as
`has-label`, and the styles that hide a wrapped native control.

`rc-common` adds `MorphRecoveryController`, which watches an element's host and
light DOM for those attributes being removed and re-runs the element's sync.
