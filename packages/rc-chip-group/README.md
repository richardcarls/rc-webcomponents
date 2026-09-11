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
