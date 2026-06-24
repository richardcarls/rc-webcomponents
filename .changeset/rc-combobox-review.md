---
"@rcarls/rc-combobox": minor
---

**rc-combobox:** Fix `allow-create` attribute name — the `allowCreate` property is now
correctly reflected as `allow-create` in HTML (previously reflected as `allowcreate` due to
Lit's default camelCase lowercasing).

**Migration:** Update the attribute in HTML and JSX:

```diff
- <rc-combobox allowcreate>
+ <rc-combobox allow-create>
```

Also switches the required native `<select>` from a named slot (`slot="select"`) to the
default (unnamed) slot, matching the progressive-enhancement pattern established by `rc-select`.

**Migration:** Remove `slot="select"` from the `<select>` child element:

```diff
- <rc-combobox><select slot="select" name="tags">…</select></rc-combobox>
+ <rc-combobox><select name="tags">…</select></rc-combobox>
```

Additional changes: replace the `&#9660;` toggle character with an inline SVG chevron icon;
expand README and docs-site coverage including `allow-create` validation patterns, React state
management, and form usage with ephemeral options.
