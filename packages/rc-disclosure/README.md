# @rcarls/rc-disclosure

Native `<details>`/`<summary>` disclosure web component with light-DOM styling hooks and
controlled or uncontrolled open state.

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-disclosure](https://richardcarls.github.io/rc-webcomponents/components/rc-disclosure).

```html
<rc-disclosure default-open>
  <details>
    <summary>Shipping details</summary>
    <p>Orders usually ship within two business days.</p>
  </details>
</rc-disclosure>
```

Use `default-open` for uncontrolled initial state. Writing `open` enables controlled mode;
user interaction emits `rc-disclosure-toggle` with `{ open: boolean }`, while the rendered
state continues to follow the host value. Assign `undefined` to the JavaScript `open` property
to release control.
