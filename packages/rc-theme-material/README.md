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

The state-layer utility is included by `components.css` and `theme.css`, and is
also exported separately for selective imports:

```css
@import '@rcarls/rc-theme-material/state-layer.css';
```

Apply `.rc-state-layer` to interactive elements that already define their own
border radius when you want a CSS-only Material state layer.

Theme styles are scoped under a `.rc-theme-material` class.

```html
<body class="rc-theme-material">
  <!-- rc-webcomponents -->
</body>
```

### Button variants and tones

The default `rc-button` treatment is filled. Use `rc-button--tonal`,
`rc-button--outlined`, or `rc-button--text` for the other Material emphasis
levels. Icon-only buttons use `rc-icon-button--standard`,
`rc-icon-button--tonal`, or `rc-icon-button--outlined`.

Add `data-tone="danger"` to any of those variants for the corresponding error
or error-container color roles. These classes and data attributes are theme
hooks; they do not change the component's native-button behavior or public API.

```html
<rc-button class="rc-button--tonal">
  <button type="button">Save draft</button>
</rc-button>

<rc-button class="rc-button--outlined" data-tone="danger">
  <button type="button">Delete</button>
</rc-button>
```

### Full standalone Material 3 theme

Includes bundled light and dark Material 3 token defaults and the full
bridge and component style layers:

```css
@import '@rcarls/rc-theme-material/theme.css';
```

## Theming scope

The full style layer styles native controls when their intent is established by
composition, for example menu items and button triggers. Otherwise, it does not style
unrelated application controls and follows design-token conventions.

Fonts and icons are not bundled; websites and applications may provide
[Roboto](https://fonts.google.com/specimen/Roboto) and
[Material Symbols](https://fonts.google.com/icons) through other means.
Tag general icon-font markup with `data-rc-icon`; component-specific markers
such as `data-rc-button-icon` and `data-rc-navigation-icon` opt in
automatically. The shared `--rc-icon-font-size` and
`--rc-icon-font-line-height` tokens keep glyph geometry consistent and can be
overridden at the theme boundary or on one component.

### Icon-button modifiers

Apply these classes to `rc-button[icon-only]` to use the Material 3 expressive
container and icon sizes. The default, unmodified size is small: a `2.5rem`
container with a `1.5rem` icon.

| Class                    | Container |      Icon |
| ------------------------ | --------: | --------: |
| `rc-button--extra-small` |    `2rem` | `1.25rem` |
| `rc-button--medium`      |  `3.5rem` |  `1.5rem` |
| `rc-button--large`       |    `6rem` |    `2rem` |
| `rc-button--extra-large` |  `8.5rem` |  `2.5rem` |

Combine a size class with `rc-button--narrow` or `rc-button--wide` to select
that size's narrower or wider container width without changing its height or
icon size. `rc-menu-button[icon-only]` supports `rc-menu-button--narrow` for a
`2rem`-wide small trigger. The component packages continue to reserve a `3rem`
activation area around visual containers smaller than that target.

`rc-adaptive-menu` uses the same Material small narrow geometry for its
overflow trigger: a `2rem × 2.5rem` visible container centered in the
component-owned `3rem × 3rem` activation area. The theme also aligns overflow
rows with Material menu geometry while leaving the component's controlled or
uncontrolled `open` contract unchanged.

Direct native buttons in an `rc-app-bar`'s `leading` and `trailing` slots also
receive the Material small icon-button geometry. Controls nested in an
`rc-button` or `rc-menu-button` keep their component-owned sizing.

[Material Web](material-web.dev) token names are used where a corresponding component
exists. Search bar and top app bar mappings follow Material 3 token terminology and
fall back through Material system roles.
