# @rcarls/rc-button

Progressive-enhancement button wrapper with structural state affordances.

```html
<rc-button toggle default-selected>
  <button type="button">
    <span data-rc-button-icon aria-hidden="true">♡</span>
    <span data-rc-button-selected-icon aria-hidden="true">♥</span>
    <span data-rc-button-label>Save</span>
  </button>
</rc-button>
```

The native `<button>` remains in light DOM as the semantic and form-associated
control. `rc-button` adds reflected state attributes, icon/label classification,
and overlay parts for state-layer and progress effects. `pending` and `progress`
disable the native control while busy; add `progress-value="50"` for determinate
progress. Add `toggle` for managed `aria-pressed` semantics and use
`default-selected` or controlled `selected` state. User activation dispatches
`rc-button-toggle` with the requested next `selected` state.
