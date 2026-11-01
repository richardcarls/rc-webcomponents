---
'@rcarls/rc-common': patch
'@rcarls/rc-webcomponents': minor
'@rcarls/rc-app-bar': patch
'@rcarls/rc-carousel': patch
'@rcarls/rc-field': patch
'@rcarls/rc-page-turner': patch
'@rcarls/rc-range-slider': patch
'@rcarls/rc-search-bar': patch
'@rcarls/rc-slider': patch
'@rcarls/rc-splitter': patch
'@rcarls/rc-toolbar': patch
'@rcarls/rc-transfer-list': patch
---

Server-rendered elements now hydrate to the same shadow DOM a client render produces. The
elements that read native children, slotted content, or slot-derived state while rendering
use `HydrationController`: their first client update matches the server markup, and a
second update applies the real state. Every element except `rc-textarea` and the internal
`rc-editor-toolbar` is verified by a per-package server-render fixture.

`@rcarls/rc-webcomponents/hydrate-support` loads Lit's hydration support; import it before
any element definition on a server-rendered page.

`rc-page-turner` no longer throws when inserted markup connects it before its pages upgrade.
