---
'@rcarls/rc-textarea': minor
'@rcarls/rc-markdown-editor': minor
'@rcarls/rc-theme-material': minor
'@rcarls/rc-theme-substrate': minor
'@rcarls/rc-webcomponents': minor
---

**Breaking:** take `rc-textarea`'s read-only state from the slotted `<textarea readonly>` and
remove the `read-only` attribute and its display styling without border or padding. A read-only
editor keeps the enabled field appearance, stays focusable and selectable, announces `aria-
readonly` with the native control's label, and rejects edits. The host reflects `data-readonly`,
and `readOnly` is now a getter. The plugin `transform()` hook runs while the textarea is
`readonly`.

`rc-markdown-editor` passes its `read-only` state to a native textarea in its source editor.
Material and Substrate fields skip the hover affordance for a read-only control and keep its
focus indicator.

Migration: replace `<rc-textarea read-only>` with `readonly` on the slotted textarea, for
example `<rc-textarea><textarea aria-label="Notes" readonly></textarea></rc-textarea>`. Replace
`editor.readOnly = value` with `textarea.readOnly = value`. Read-only content that is not a form
value belongs in ordinary text or list markup instead.
