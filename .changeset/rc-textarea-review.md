---
"@rcarls/rc-textarea": minor
---

Add `parseDecorationsFromHtml` to the plugin API as the canonical name for the
HTML-highlighter bridge helper (deprecates `decorationsFromHtml`). Register
`rc-textarea` in the global `HTMLElementTagNameMap` for typed
`querySelector`/`createElement` lookups. Expand JSDoc across all public
interfaces, the component class, and the plugin API. Internal Parchment blot
classes and document helpers renamed from the `V2` prefix to `RC`.
