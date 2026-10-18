# `@rcarls/rc-popover`

Anchored non-modal surface around a native trigger and consumer-owned content.

Docs: [rc-popover](https://richardcarls.github.io/rc-webcomponents/components/rc-popover).

```sh
npm install @rcarls/rc-popover
```

```js
import '@rcarls/rc-popover/define';
```

```html
<rc-popover placement="block-end-start">
  <button slot="trigger" type="button" popovertarget="help-panel" aria-haspopup="dialog">
    Help
  </button>
  <section slot="content" id="help-panel" popover role="dialog" aria-labelledby="help-title">
    <h2 id="help-title">About this setting</h2>
    <p>Changes here affect future exports.</p>
    <a href="/help/exports">Learn more</a>
  </section>
</rc-popover>
```

The native button and popover work before the component upgrades. After upgrade,
`rc-popover` positions the surface and handles native and fallback visibility.
The author supplies the content's role, accessible name, and keyboard behavior.
`open` is controlled and host writes are silent; use `default-open` for initial
uncontrolled state. `trigger-action="none"` disables click activation, while
`open-on-hover` and `open-on-focus` opt into those activation paths.
