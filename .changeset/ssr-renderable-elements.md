---
'@rcarls/rc-common': minor
'@rcarls/rc-app-bar': patch
'@rcarls/rc-field': patch
'@rcarls/rc-menu-button': patch
'@rcarls/rc-fab-menu': patch
'@rcarls/rc-progress': patch
'@rcarls/rc-search-bar': patch
'@rcarls/rc-splitter': patch
'@rcarls/rc-toolbar': patch
'@rcarls/rc-virtual-canvas': patch
'@rcarls/rc-select': patch
'@rcarls/rc-combobox': patch
'@rcarls/rc-transfer-list': patch
'@rcarls/rc-listbox': patch
---

Every element now renders with Lit's server renderer (`@lit-labs/ssr`), and shadow-DOM
elements render a declarative shadow root. Elements no longer create observers in
constructors or read the DOM, inline styles, or ancestors while rendering on a server.

`rc-common` adds `setServerLocale()`, the UI language elements use while rendering on a
server, and `HydrationController`, which lets an element that reads its light DOM while
rendering hydrate a server-rendered shadow root to the same result a client render gives.
`rc-progress` uses it.
