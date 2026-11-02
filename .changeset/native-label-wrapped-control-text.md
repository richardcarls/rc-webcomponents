---
'@rcarls/rc-common': patch
'@rcarls/rc-markdown-editor': patch
'@rcarls/rc-textarea': patch
'@rcarls/rc-webcomponents': patch
---

Exclude a native control's own subtree when copying its wrapping label text to a shadow-DOM
surface. Initial textarea content and select option text no longer become part of that label.
