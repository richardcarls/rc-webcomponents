# Progressive enhancement

`rc-webcomponents` components are designed to enhance native HTML instead of
replacing it. When a component wraps a platform control, the consumer supplies
that native element as a direct child and the component keeps it in the document
after upgrade.

This rule is what makes form submission, labels, browser validation, and
pre-upgrade interaction continue to work without custom-element registration.

## Native controls stay native

Wrapper components such as `rc-select`, `rc-slider`, `rc-range-slider`,
`rc-textarea`, and `rc-dialog` require the native element that owns the platform
behavior:

```html
<label for="country">Country</label>
<rc-select placeholder="Choose a country">
  <select id="country" slot="select" name="country">
    <option value="">Choose a country</option>
    <option value="ca">Canada</option>
  </select>
</rc-select>
```

The native child remains the form control. Put `name`, `id`, `value`,
validation attributes, and accessible names on the native element unless the
component page documents a different requirement.

## Labels and forms work before upgrade

Use normal HTML labeling patterns:

- A visible `<label for="id">` that points to the native control.
- A wrapping `<label>` around the component and native control.
- `aria-label` or `aria-labelledby` directly on the native control when there is
  no visible label.

Because the native element is present before JavaScript runs, the page remains
usable while the custom element definition loads.

## API documentation source

Component API tables are generated from `dist/custom-elements.json`. If a public
property, attribute, method, event, slot, CSS part, or CSS custom property
changes, regenerate the manifest before building docs:

```sh
yarn.cmd cem:analyze
yarn.cmd workspace @rcarls/rc-docs run build
```

On Linux and macOS, use `yarn` instead of `yarn.cmd`.

## Related components

- [rc-select](/components/rc-select) enhances a native `<select>`.
- [rc-slider](/components/rc-slider) enhances a native `<input type="range">`.
- [rc-range-slider](/components/rc-range-slider) coordinates two native range inputs.
- [rc-textarea](/components/rc-textarea) enhances a native `<textarea>`.
- [rc-dialog](/components/rc-dialog) enhances a native `<dialog>`.
