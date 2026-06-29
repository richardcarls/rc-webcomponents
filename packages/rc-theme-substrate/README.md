# `@rcarls/rc-theme-substrate`

Substrate is the lightweight reference theme for `rc-webcomponents`.

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
