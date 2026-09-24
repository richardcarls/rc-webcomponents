---
'@rcarls/rc-textarea': patch
'@rcarls/rc-markdown-editor': patch
'@rcarls/rc-listbox': patch
'@rcarls/rc-select': patch
'@rcarls/rc-combobox': patch
'@rcarls/rc-theme-material': patch
---

Use logical CSS properties so layout follows the reading direction and
writing mode: the textarea gutter border and alignment, line-action and
diagnostic-message spacing, the markdown editor's block quote and list
indents, and block-axis scrolling for listbox, select, combobox, and markdown
panes, each keeping its physical declaration as a fallback.
