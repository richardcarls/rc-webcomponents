---
'@rcarls/rc-common': minor
'@rcarls/rc-accordion': patch
'@rcarls/rc-adaptive-menu': patch
'@rcarls/rc-bottom-sheet': patch
'@rcarls/rc-button': patch
'@rcarls/rc-chip': patch
'@rcarls/rc-dialog': patch
'@rcarls/rc-disclosure': patch
'@rcarls/rc-field': patch
'@rcarls/rc-list': patch
'@rcarls/rc-listbox': patch
'@rcarls/rc-menu': patch
'@rcarls/rc-menu-button': patch
'@rcarls/rc-navigation-rail': patch
'@rcarls/rc-popover': patch
'@rcarls/rc-search-bar': patch
'@rcarls/rc-segmented-button': patch
'@rcarls/rc-tooltip': patch
---

`rc-common` adds `defineLightDomBaseStyles(name, css)`, which registers a component's
structural light-DOM stylesheet and returns the function that installs it once per document
or shadow root, plus `registeredLightDomBaseStyles()` for build tooling. Every component
that injects light-DOM base styles now uses it.

A root that already holds a stylesheet whose `data-rc-light-dom-base` attribute lists the
component's tag, or `all`, no longer receives a second runtime copy. A server-rendered page
can mark a linked base stylesheet that way to skip the injection.
