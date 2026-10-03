---
'@rcarls/rc-textarea': patch
'@rcarls/rc-webcomponents': patch
---

Extend the `rc-textarea` active-line highlight edge to edge. The active line
and its gutter cell now paint `--rc-textarea-active-line-bg` through the editor
and gutter padding, so the row reads as one band across the whole control.
