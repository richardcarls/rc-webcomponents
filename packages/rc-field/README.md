# rc-field

Accessible field wrapper for a native input or textarea with labels and supporting text.

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-field](https://richardcarls.github.io/rc-webcomponents/components/rc-field).

`rc-field` keeps the native control in light DOM as the source of truth for value, validation,
autofill, labels, and form submission. It adds layout, state hooks, accessible hint/error wiring,
and theme affordances without replacing the browser's control behavior.

## Install

```bash
npm install @rcarls/rc-field
```

```bash
yarn add @rcarls/rc-field
```

## Use

```js
import '@rcarls/rc-field/define';
```

```html
<rc-field counter>
  <label slot="label" for="recipe-title">Recipe title</label>
  <input id="recipe-title" name="title" maxlength="80" required />
  <small slot="hint">Use the title printed on the recipe.</small>
  <small slot="error">Enter a recipe title.</small>
</rc-field>
```

The control must be a direct child. Use an explicit `for` and `id` pair when the label should work
before custom-element upgrade. A slotted native label without `for` is associated automatically
after upgrade; an ancestor native label can wrap the complete field instead. Native `input`,
`change`, and `invalid` events are not replaced or duplicated.

Call `sync()` after changing `.value` programmatically. Native input events, constraint attributes,
form reset, and control replacement synchronize automatically.

## Material theme

Import `@rcarls/rc-theme-material/theme.css` and place the field under `.rc-theme-material`.
Filled is the default treatment; add `class="rc-field--outlined"` for the outlined variant.

An enhancing control may wrap the native control when the direct child is explicitly marked as
the field control provider. The native control must remain its direct child:

```html
<rc-field>
  <label slot="label" for="notes">Notes</label>
  <rc-textarea data-rc-field-control>
    <textarea id="notes" name="notes"></textarea>
  </rc-textarea>
</rc-field>
```
