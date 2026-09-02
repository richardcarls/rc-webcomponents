# @rcarls/rc-progress

Native `<progress>` enhancer with a formatted value display, a track and fill
you can restyle with CSS custom properties, and a built-in fix for the
indeterminate/undefined-binding footgun.

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-progress](https://richardcarls.github.io/rc-webcomponents/components/rc-progress).

## Styling Hooks

`rc-progress` progressively enhances a direct child `<progress>`. The element
remains consumer-owned light DOM (so it keeps its native `role="progressbar"`
and any `id`-based associations), while the component renders its track, fill,
and value display in shadow DOM.

```html
<rc-progress display="inline-end" value-text="4 of 10 recipes synced">
  <progress value="4" max="10" aria-label="Sync progress"></progress>
</rc-progress>
```

The component exposes `root`, `control`, `track`, `fill`, and `value-display`
CSS parts.

## Indeterminate

Toggle the `indeterminate` attribute instead of binding `undefined` to the
native element's `value`: the component removes/restores the attribute for
you, avoiding the well-known `<progress>.value = undefined` throw:

```html
<rc-progress indeterminate>
  <progress aria-label="Preparing…"></progress>
</rc-progress>
```
