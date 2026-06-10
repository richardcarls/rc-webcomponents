# `@rcarls/rc-theme-material`

Optional Material 3 design-token bridge and full CSS style layer for
`rc-webcomponents`.

The package maps Material system and component CSS custom properties into RC's
public `--rc-*` styling contracts. It changes presentation only; it does not
claim behavioral or structural conformance with Material components.

## Installation

```sh
yarn add @rcarls/rc-theme-material
```

Use an application's existing Material token environment:

```css
@import '@rcarls/rc-theme-material/bridge.css';
```

```html
<main class="rc-theme-material">
  <!-- rc components -->
</main>
```

For a standalone baseline that includes representative light and dark Material
system tokens and the full component style layer:

```css
@import '@rcarls/rc-theme-material/theme.css';
```

Import `defaults.css` separately when only the baseline Material system tokens
are needed. Import `components.css` with `bridge.css` when an application
provides its own Material system tokens but wants the full RC component styling.
`bridge.css` never defines `--md-sys-*`, so branded or dynamically generated
application tokens remain authoritative.

Selective component styles are also exported:

```css
@import '@rcarls/rc-theme-material/bridge.css';
@import '@rcarls/rc-theme-material/components/select.css';
@import '@rcarls/rc-theme-material/components/menu.css';
```

Package rules use ordered cascade layers:

```css
@layer rc-theme-material.defaults, rc-theme-material.bridge, rc-theme-material.components;
```

Unlayered application CSS and application layers declared after these layers
can override the theme normally.

## Supported mappings

The initial bridge and style layer cover:

- `rc-select` and `rc-combobox`
- `rc-slider` and `rc-range-slider`
- `rc-search-bar`
- `rc-app-bar`
- `rc-menu`, `rc-menu-button`, and `rc-menubar`
- `rc-toolbar`
- `rc-listbox`, `rc-textarea`, `rc-markdown-editor`, and `rc-transfer-list`
- `rc-dialog`, `rc-disclosure`, and `rc-accordion`
- `rc-splitter` and `rc-virtual-canvas`

Material Web token names are used where a corresponding component exists.
Search bar and top app bar mappings follow Material 3 token terminology and
fall back through Material system roles.

The initial mapping targets Material Web's `v0_192` component-token generation
and the public token names documented at material-web.dev. Material Web token
changes are not adopted silently; mapping updates are versioned package API.

Consumer-provided native controls remain consumer-owned. The bridge does not
style arbitrary buttons or infer filled, tonal, text, or icon-button intent.
Menu-button mappings provide trigger geometry only; applications choose trigger
colors and button variants.

The full style layer does style native controls when their intent is established
by an RC composition, including menu items, menu triggers, toolbar controls,
app-bar actions, transfer-list actions, disclosure summaries, and dialog
actions. It never styles unrelated application controls.

## Fidelity

| Surface | Fidelity | Notes |
| --- | --- | --- |
| Select, combobox, listbox, menus, search, app bar, sliders | Strong | Existing parts and states support recognizable M3 treatments. |
| Toolbar, transfer list, textarea, splitter, dialog, disclosure | Approximate | Material styling is applied to RC's existing structure. |
| Markdown editor and virtual canvas | Foundational | Surface, state, and contextual-control styling only. |

Floating labels, supporting/error text structures, ripples, Material button
variants, and richer component-specific compositions require future styling
hooks or structural variants. Fonts and icons are not bundled; applications may
provide Roboto and Material Symbols through their normal asset pipeline.

## Token precedence

Component tokens override system tokens, which override RC's platform fallback:

```css
--rc-slider-progress-background:
  var(--md-slider-active-track-color, var(--md-sys-color-primary, Highlight));
```

The bridge's Material token mapping is a versioned public contract. Review
release notes before upgrading when an application overrides Material component
tokens directly.
