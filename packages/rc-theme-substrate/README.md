# `@rcarls/rc-theme-substrate`

Lightweight CSS reference theme for app-oriented `rc-webcomponents` layouts.

Docs: [https://richardcarls.github.io/rc-webcomponents/guide/theme-previews](https://richardcarls.github.io/rc-webcomponents/guide/theme-previews).

It is a CSS-only, app-oriented foundation theme: orange primary color,
neutral surfaces, compact controls, system-color fallbacks, and a small set of
component polish rules that demonstrate how to build a branded theme without
copying the heavier Material package.

## Installation

```sh
yarn add @rcarls/rc-theme-substrate
```

## Full reference theme

Import the full theme bundle:

```css
@import '@rcarls/rc-theme-substrate/theme.css';
```

Apply the theme class to your app shell or any subtree:

```html
<main class="rc-theme-substrate">
  <rc-select>...</rc-select>
  <rc-dialog>...</rc-dialog>
</main>
```

## Build your own theme from it

Substrate is intentionally token-first. To use it as a branded foundation,
copy the `bridge.css` pattern and override the public semantic tokens at your
theme boundary.

```css
@import '@rcarls/rc-theme-substrate/bridge.css';
@import '@rcarls/rc-theme-substrate/components.css';

.my-product-theme {
  --substrate-primary: oklch(58% 0.19 275);
  --substrate-radius-md: 0.5rem;
  --substrate-font-family: Inter, system-ui, sans-serif;
}
```

Selective component styles are exported for apps that want only part of the
reference layer:

```css
@import '@rcarls/rc-theme-substrate/bridge.css';
@import '@rcarls/rc-theme-substrate/components/select.css';
@import '@rcarls/rc-theme-substrate/components/dialog.css';
```

Native HTML can opt into the same presentation without registering an RC
element. Import the defaults and bridge when needed, then opt into the native
layer and CSS-only recipes:

```css
@import '@rcarls/rc-theme-substrate/defaults.css';
@import '@rcarls/rc-theme-substrate/bridge.css';
@import '@rcarls/rc-theme-substrate/native.css';
@import '@rcarls/rc-theme-substrate/css-components.css';
```

`native.css` is an optional convenience layer for styling ordinary buttons,
text fields, selects, textareas, checkboxes, radios, ranges, and progress
controls throughout `.rc-theme-substrate`. Component recipes style native
children when their presentation belongs to a themed menu, toolbar, or other
component context. Add `data-rc-native="off"` to an element to opt it and its
descendants out of the native layer. The
opt-in `css-components.css` recipes cover `.rc-button`, `.rc-chip`,
`.rc-chip-group`, `.rc-select`, `.rc-textarea`, `.rc-card`, `.rc-list`, and
`details.rc-disclosure`; each is also exported as
`css-components/<name>.css`. They provide appearance and CSS-visible states
only, not behavior, events, popup replacement, or measured overflow.

Tag general icon-font markup with `data-rc-icon`; component-specific markers
such as `data-rc-button-icon` and `data-rc-navigation-icon` opt in
automatically. The shared `--rc-icon-font-size` and
`--rc-icon-font-line-height` tokens keep glyph geometry consistent and can be
overridden at the theme boundary or on one component.

## View transitions

Substrate includes stable CSS hooks for apps that opt into View Transitions,
but it does not start transitions or require browser support:

```css
.rc-theme-substrate [data-rc-view-transition='panel'] {
  --rc-view-transition-name: rc-panel;
}
```

Application code remains responsible for deciding when to call
`document.startViewTransition()`.
