# @rcarls/rc-chip-group

Adaptive wrapping and horizontal-scrolling layout for `rc-chip`, native
controls, or arbitrary elements.

```html
<fieldset>
  <legend>Recipe scope</legend>
  <rc-chip-group kind="filter" selection="single" label="Recipe scope">
    <rc-chip>
      <label><input type="radio" name="scope" value="all" checked />All</label>
    </rc-chip>
    <rc-chip>
      <label><input type="radio" name="scope" value="favorites" />Favorites</label>
    </rc-chip>
  </rc-chip-group>
</fieldset>
```

`layout="auto"` is the default. Content wraps naturally while it fits within
`max-rows="2"`; larger groups become one horizontally scrolling row with a
leading **Show all** chip. The same action becomes **Show less** while expanded.

Use `kind="assist"` for toolbar semantics and roving arrow-key navigation,
`kind="filter"` for native radio/checkbox chips, or `kind="generic"` for
layout-only behavior. Filter fieldset and legend semantics remain author-owned.

## Localization

Built-in text follows the element's own `lang`, else `<html lang>`, and never an
ancestor's `lang`, which usually marks content. Override it per element with the
`messages` property, or for every instance with `registerMessages()` from
`@rcarls/rc-common` under `rc-chip-group`. Keys: `label`, `showAll`, `showLess`. `label` only applies when the `label` attribute is unset. See the
[rc-common Localization section](https://github.com/richardcarls/rc-webcomponents/tree/develop/packages/rc-common#localization).
