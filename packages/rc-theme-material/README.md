# `@rcarls/rc-theme-material`

[Material 3](https://m3.material.io/) CSS theme and token bridge for `rc-webcomponents`.

Docs: [https://richardcarls.github.io/rc-webcomponents/guide/theme-previews](https://richardcarls.github.io/rc-webcomponents/guide/theme-previews).

Maps Material Design system and component CSS custom properties onto the
public `--rc-*` styling contract. It changes presentation only and is an
entirely optional theme package.

Material 3 tokens and defaults vendored from the archived
[material-foundation/material-tokens](https://github.com/material-foundation/material-tokens)

## Installation

```sh
yarn add @rcarls/rc-theme-material
```

### Bridge your existing Material 3 theme

Import the design-token bridge and `rc-webcomponents` styles.

```css
@import '@rcarls/rc-theme-material/bridge.css';
@import '@rcarls/rc-theme-material/components.css';
```

Selective component styles are also exported:

```css
@import '@rcarls/rc-theme-material/bridge.css';
@import '@rcarls/rc-theme-material/components/select.css';
@import '@rcarls/rc-theme-material/components/menu.css';
```

Theme styles are scoped under a `.rc-theme-material` class.

```html
<body class="rc-theme-material">
  <!-- rc-webcomponents -->
</body>
```

### Full standalone Material 3 theme

Includes bundled light and dark Material 3 token defaults and the full
bridge and component style layers:

```css
@import '@rcarls/rc-theme-material/theme.css';
```

## Theming scope

The full style layer will style native controls when their intent is established
by composition (e.g., menu items, button triggers, etc.). Otherwise, It never styles
unrelated application controls and tries to follow design token conventions.

Fonts and icons are not bundled; websites and applications may provide
[Roboto](https://fonts.google.com/specimen/Roboto) and
[Material Symbols](https://fonts.google.com/icons) through other means.

[Material Web](material-web.dev) token names are used where a corresponding component
exists. Search bar and top app bar mappings follow Material 3 token terminology and
fall back through Material system roles.
