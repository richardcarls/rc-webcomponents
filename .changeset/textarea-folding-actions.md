---
'@rcarls/rc-textarea': minor
'@rcarls/rc-textarea-plugin-markdown': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-webcomponents': minor
---

**Breaking:** replace `LineDisclosureController` with `FoldingActionController`.
Pass a caller-owned panel as `target` and render it through a block widget, or pass
`{ fromLine, toLine }` to fold source lines. Panel creation and content revision now
belong to the plugin. Set `initiallyExpanded: false` to retain the old diagnostic
panel default; call `clear()` when document identity changes.

Folding actions keep source text, form values, and undo history intact. The Markdown
plugin adds gutter folds for heading sections, lists, code blocks, block quotes,
and GFM tables. The base gutter has a 24px minimum width; Material uses 48px.
Folding buttons expose `fold-trigger` and `fold-icon` CSS parts, and
`createMarkdownPlugin({ folding: { createTriggerIcon } })` lets consumers choose
the Markdown fold icon.
