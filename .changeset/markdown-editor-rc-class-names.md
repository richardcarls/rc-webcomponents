---
'@rcarls/rc-markdown-editor': minor
'@rcarls/rc-webcomponents': minor
---

**Breaking:** the element classes `RcMarkdownEditor` and `RcEditorToolbar` are renamed
`RCMarkdownEditor` and `RCEditorToolbar`, matching every other `RC*` element class. The tags
and their behavior are unchanged.

Migration: rename imports and type references, for example
`import { RCMarkdownEditor } from '@rcarls/rc-markdown-editor'`.
