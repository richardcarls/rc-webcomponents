---
'@rcarls/rc-webcomponents': minor
---

Adds generated Blazor event bindings. `blazor/rc-webcomponents.lib.module.js`
is a JavaScript initializer that registers every `rc-*` event with Blazor and
passes its detail to .NET, and `blazor/RcWebComponents.Events.cs` adds an
`EventArgs` class per event and the `[EventHandler]` attributes, so
`@onrc-pagination-change` handlers are typed. The docs gain a Blazor guide.
