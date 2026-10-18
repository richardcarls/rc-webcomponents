---
'@rcarls/rc-common': minor
'@rcarls/rc-accordion': patch
'@rcarls/rc-adaptive-menu': patch
'@rcarls/rc-app-bar': patch
'@rcarls/rc-bottom-sheet': patch
'@rcarls/rc-button': patch
'@rcarls/rc-card': patch
'@rcarls/rc-carousel': patch
'@rcarls/rc-chip': patch
'@rcarls/rc-chip-group': patch
'@rcarls/rc-combobox': patch
'@rcarls/rc-dialog': patch
'@rcarls/rc-disclosure': patch
'@rcarls/rc-fab': patch
'@rcarls/rc-fab-menu': patch
'@rcarls/rc-field': patch
'@rcarls/rc-list': patch
'@rcarls/rc-listbox': patch
'@rcarls/rc-markdown-editor': patch
'@rcarls/rc-menu': patch
'@rcarls/rc-menu-button': patch
'@rcarls/rc-menubar': patch
'@rcarls/rc-navigation-bar': patch
'@rcarls/rc-navigation-rail': patch
'@rcarls/rc-popover': patch
'@rcarls/rc-progress': patch
'@rcarls/rc-range-slider': patch
'@rcarls/rc-scroller': patch
'@rcarls/rc-search-bar': patch
'@rcarls/rc-segmented-button': patch
'@rcarls/rc-select': patch
'@rcarls/rc-slider': patch
'@rcarls/rc-snackbar': patch
'@rcarls/rc-splitter': patch
'@rcarls/rc-switch': patch
'@rcarls/rc-textarea': patch
'@rcarls/rc-toolbar': patch
'@rcarls/rc-tooltip': patch
'@rcarls/rc-transfer-list': patch
'@rcarls/rc-virtual-canvas': patch
'@rcarls/rc-virtual-scroller': patch
'@rcarls/rc-webcomponents': patch
---

Ship component CSS minified. Package builds now run the CSS in Lit `css` styles
and light-DOM structural styles through Lightning CSS, removing comments and
whitespace while keeping source maps that resolve to each template. Rendered
styles are unchanged.

`@rcarls/rc-common` adds `cssText`, an identity tag that marks a plain CSS
string for minification. `rc-chip`, `rc-disclosure`, and `rc-accordion` now
depend on `@rcarls/rc-common` for it.
