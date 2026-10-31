---
'@rcarls/rc-accordion': minor
'@rcarls/rc-adaptive-menu': minor
'@rcarls/rc-bottom-sheet': minor
'@rcarls/rc-button': minor
'@rcarls/rc-chip': minor
'@rcarls/rc-dialog': minor
'@rcarls/rc-disclosure': minor
'@rcarls/rc-field': minor
'@rcarls/rc-list': minor
'@rcarls/rc-listbox': minor
'@rcarls/rc-menu': minor
'@rcarls/rc-menu-button': minor
'@rcarls/rc-navigation-rail': minor
'@rcarls/rc-popover': minor
'@rcarls/rc-search-bar': minor
'@rcarls/rc-segmented-button': minor
'@rcarls/rc-tooltip': minor
'@rcarls/rc-webcomponents': minor
---

Every component that injects light-DOM base styles now also ships them as a static
stylesheet at `@rcarls/<package>/base.css`, and `@rcarls/rc-webcomponents` adds
`themes/components-base.css`, which imports all of them. Linking these from a
server-rendered page applies the structural layout before the elements upgrade. A
`<link>` or `<style>` marked `data-rc-light-dom-base="<tag>"` (or `"all"`) also stops the
element from injecting its runtime copy.
