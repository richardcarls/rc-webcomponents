---
'@rcarls/rc-field': minor
---

Support `<select>` as a field control, both as a plain direct child and wrapped by an
enhancing control provider (the same contract `rc-textarea` already uses). Populated state for
a multiple select comes from `selectedOptions` rather than `.value`, which only reflects the
first selected option in tree order and can read empty even with a real selection.
