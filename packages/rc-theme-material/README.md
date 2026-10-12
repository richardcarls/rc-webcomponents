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

`rc-field` uses the Material 3 filled text-field treatment by default. Add
`rc-field--outlined` for the outlined variant.

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

## Designing with the theme

[`DESIGN.md`](./DESIGN.md) is a Material 3 composition guide written for AI
coding agents. It covers which component fills which Material role, adaptive
layouts by window size class, dialogs, sheets, lists, navigation and
feedback, with the baseline token values in machine-readable front matter. It
ships in the package and is exported as `@rcarls/rc-theme-material/DESIGN.md`,
so agents in a consuming app can read it from `node_modules`, or under Yarn
Plug'n'Play with:

```sh
yarn node -e "process.stdout.write(require('fs').readFileSync(require.resolve('@rcarls/rc-theme-material/DESIGN.md'), 'utf8'))"
```

App design documents should reference it for Material 3 composition and keep
only their own overrides, branding and product patterns.

## Theming scope

The full style layer styles native controls when their intent is established by
composition, for example menu items and button triggers. Otherwise, it does not style
unrelated application controls and follows design-token conventions.

Fonts and icons are not bundled; websites and applications may provide
[Roboto](https://fonts.google.com/specimen/Roboto) and
[Material Symbols](https://fonts.google.com/icons) through other means.

### Scoped type scale

Mark a region with `data-rc-type-scale` and set `--rc-type-scale` to enlarge or
shrink its text, such as a reading view used at arm's length. Every Material type
size and line height beneath the marked element, and the RC text tokens built on
them, are multiplied by the factor. Text outside the region is unchanged.

```html
<main data-rc-type-scale style="--rc-type-scale: 1.25">…</main>
```

Marking the theme root itself scales the whole page, for an app-wide text size
setting. A nested marked region uses its own `--rc-type-scale`; to compound it
with a page-wide factor, keep that factor in a separate custom property and
multiply, since a property can't refer to its own inherited value:

```html
<html class="rc-theme-material" data-rc-type-scale style="--app-scale: 0.75; --rc-type-scale: var(--app-scale)">
  …
  <p data-rc-type-scale style="--rc-type-scale: calc(var(--app-scale) * 1.25)">…</p>
</html>
```

With `theme.css`, the Material type tokens and RC text tokens scale from the
bundled `defaults.css` values. With `bridge.css` alone, RC text tokens scale from
the application's Material type tokens; the application's own
`--md-sys-typescale-*` tokens remain unchanged. Supply both size and line-height
tokens for the roles used by RC components when customizing the bridge. If your
Material token environment also defines matching `*-size-value` or
`*-line-height-value` source tokens, those are the scale baseline; update them
alongside branded final values.

### Icon font wiring

The theme sizes and centers icon markers but never sets `font-family` on them,
because no font ships with it. Until the application supplies one, a marker
renders its literal text, so a navigation toggle shows the word `menu`. See
[Fonts and icons](./DESIGN.md#fonts-and-icons) in the design guide for the
one rule that wires every marker.

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
