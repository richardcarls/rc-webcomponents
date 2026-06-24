---
"@rcarls/rc-select": minor
"@rcarls/rc-theme-material": patch
---

**rc-select:** Switch required native `<select>` from a named slot (`slot="select"`) to the
default (unnamed) slot. This matches the preferred progressive-enhancement pattern for all
native-child components in this library.

**Migration:** Remove `slot="select"` from the `<select>` child element:

```diff
- <rc-select><select slot="select" name="status">…</select></rc-select>
+ <rc-select><select name="status">…</select></rc-select>
```

Also adds implementor-facing JSDoc to all protected members for subclass authors.

**rc-theme-material:** Update `select.css` CSS selectors to match the `rc-select` default slot change.
