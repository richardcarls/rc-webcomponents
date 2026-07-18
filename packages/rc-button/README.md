# @rcarls/rc-button

Progressive-enhancement button wrapper with structural state affordances.

```html
<rc-button pending>
  <button type="button">
    <span data-rc-button-icon aria-hidden="true">+</span>
    <span data-rc-button-label>Save</span>
  </button>
</rc-button>
```

The native `<button>` remains in light DOM as the semantic and form-associated
control. `rc-button` adds reflected state attributes, icon/label classification,
and overlay parts for state-layer and progress effects.
