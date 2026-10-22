---
'@rcarls/rc-common': minor
'@rcarls/rc-adaptive-menu': minor
'@rcarls/rc-carousel': minor
'@rcarls/rc-chip-group': minor
'@rcarls/rc-combobox': minor
'@rcarls/rc-list': minor
'@rcarls/rc-listbox': minor
'@rcarls/rc-markdown-editor': minor
'@rcarls/rc-menubar': minor
'@rcarls/rc-progress': minor
'@rcarls/rc-range-slider': minor
'@rcarls/rc-search-bar': minor
'@rcarls/rc-select': minor
'@rcarls/rc-splitter': minor
'@rcarls/rc-textarea-plugin-markdown': minor
'@rcarls/rc-transfer-list': minor
'@rcarls/rc-webcomponents': minor
---

Localize every component's built-in text. Button names, role
descriptions, announcements, and default labels now resolve per key from
the element's `messages` property, then from text registered with
`registerMessages(locale, catalog)` in `@rcarls/rc-common`, then from the
English defaults. The locale is the element's own `lang`, else
`<html lang>`; an ancestor's `lang` is ignored, because it usually marks
content rather than the interface. Components re-render when that locale
changes or new text is registered. `RcMessageCatalog` types the catalog,
and each package adds its scope to it.

Numbers a component formats as text follow the same locale:
`rc-progress`'s default percentage and `rc-splitter`'s `aria-valuetext`
use `Intl.NumberFormat`. `TypeaheadController` matches prefixes with an
`Intl.Collator`, so case and accents are ignored the way the locale
ignores them, and takes a `locale` option. `ItemsCollectionController`'s
`setCreateOption(text, label?)` takes the option's visible text from its
caller.

`rc-transfer-list`'s direction arrows are now decorative: screen readers
read only the action name, and the arrows turn over in RTL.

**Breaking:** chrome-text properties are replaced by `messages`. Migrate:

- `rc-search-bar` `clear-label` / `clearLabel` → `messages.clear`
- `rc-adaptive-menu` `overflow-label` / `overflowLabel` → `messages.overflow`
- `rc-chip-group` `show-all-label` / `showAllLabel` and `show-less-label` /
  `showLessLabel` → `messages.showAll` and `messages.showLess`
- `rc-select` and `rc-combobox` `dialog-confirm-label` /
  `dialogConfirmLabel` and `dialog-cancel-label` / `dialogCancelLabel` →
  `messages.done` and `messages.cancel`
- `rc-editor-toolbar` `label` → `messages.toolbar`

Per-instance names stay attributes, but now default to `undefined` and fall
back to a message: `label` on `rc-adaptive-menu`, `rc-chip-group`,
`rc-menubar`, and `rc-splitter`; `available-label` and `selected-label`
on `rc-transfer-list`; `low-label` and `high-label` on `rc-range-slider`.
Read the resolved name from the rendered `aria-label` instead of the
property.
