---
'@rcarls/rc-adaptive-menu': minor
'@rcarls/rc-app-bar': minor
'@rcarls/rc-bottom-sheet': minor
'@rcarls/rc-card': minor
'@rcarls/rc-chip': minor
'@rcarls/rc-chip-group': minor
'@rcarls/rc-common': minor
'@rcarls/rc-dialog': minor
'@rcarls/rc-fab': minor
'@rcarls/rc-fab-menu': minor
'@rcarls/rc-list': minor
'@rcarls/rc-markdown-editor': minor
'@rcarls/rc-menu-button': minor
'@rcarls/rc-menubar': minor
'@rcarls/rc-progress': minor
'@rcarls/rc-range-slider': minor
'@rcarls/rc-scroller': minor
'@rcarls/rc-search-bar': minor
'@rcarls/rc-segmented-button': minor
'@rcarls/rc-select': minor
'@rcarls/rc-slider': minor
'@rcarls/rc-snackbar': minor
'@rcarls/rc-splitter': minor
'@rcarls/rc-textarea': minor
'@rcarls/rc-toolbar': minor
'@rcarls/rc-virtual-scroller': minor
---

Reflected properties no longer write their default values to the host. An
element without an `orientation`, `variant`, `placement`, or similar attribute
now carries none until the property changes, and removing the attribute
restores the default instead of leaving the property `null`. Pages updated by
DOM morphing, such as Turbo, Livewire, htmx, or Blazor enhanced navigation, no
longer lose those properties when the server markup omits them.

`rc-common` adds `includeDefaults()`, which puts `useDefault` properties back
into the first update's changed map.

Breaking changes:

- CSS that selected a default value, such as `rc-toolbar[orientation='horizontal']`,
  no longer matches an element that omits the attribute. Select the
  non-default value instead, or use `:not([orientation='vertical'])`.
- `rc-segmented-button` no longer reflects `value`, and `rc-menu-button` and
  `rc-fab-menu` no longer reflect `placement`. Both attributes still set the
  property.
- `rc-markdown-editor` replaces the `toolbar` property, which defaulted to
  `true`, with `hideToolbar` (`hide-toolbar`). Replace `.toolbar=${false}`
  with the `hide-toolbar` attribute.
