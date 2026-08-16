---
'@rcarls/rc-markdown-editor': patch
---

Fix `value` so it can be set declaratively via the `value` HTML attribute. It
previously had no `@property` decorator at all, so `<rc-markdown-editor
value="...">` was silently ignored and only the JS `.value` assignment worked.
