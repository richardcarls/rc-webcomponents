---
'@rcarls/rc-textarea': patch
'@rcarls/rc-markdown-editor': patch
---

Importing `rc-textarea` or `rc-markdown-editor` no longer requires a DOM. Their shared
stylesheets are now built on first use, and the markdown editor's bundled character
reference decoder creates its element lazily, so a server render that evaluates these
modules no longer throws.
