# Theme previews

The examples throughout the component pages use default UA-oriented styling so
behavior, labels, form participation, and keyboard support stay easy to inspect.
This page shows the same rc components in their default appearance, or inside
theme previews inspired by popular design systems. Material uses the shipped
`@rcarls/rc-theme-material` bridge; iOS, Fluent, and Carbon remain docs-only
previews.

The selector in the navigation bar changes the previews on this page and the live demo
blocks on component pages. It does not write tokens to
`document.documentElement`, and it does not theme the VitePress chrome.

<ClientOnly>
  <theme-preview></theme-preview>
</ClientOnly>

## How it works

The preview element owns an open shadow root. The "None" option applies only
layout styles for the preview surface; the named theme options add a base
preview stylesheet plus the selected design-system-inspired stylesheet through
`shadowRoot.adoptedStyleSheets`.

The Material preview adopts `@rcarls/rc-theme-material/theme.css`, which combines
representative light/dark M3 defaults, the token bridge, and the full component
style layer. The other previews are illustrative and are not exported by
component packages.

Component-page live examples use the shared `.demo-section` wrapper. The global
theme controller reapplies the selected theme after client-side navigation, so
newly mounted examples receive the same semantic tokens without page-specific
theme code. For Material, it adds `.rc-theme-material` and the docs provide the
preview's `--md-sys-*` values. Examples that demonstrate explicit consumer
styling may override those tokens locally.

## Material bridge

Install the optional CSS-only package and import the bridge when an application
already provides Material system tokens:

```css
@import '@rcarls/rc-theme-material/bridge.css';
```

```html
<main class="rc-theme-material">
  <!-- rc components -->
</main>
```

For a standalone baseline, import `@rcarls/rc-theme-material/theme.css` instead.
It combines representative light/dark defaults with the bridge and full
component styles. Import
`defaults.css` separately only when those system-token defaults are useful
without the RC mappings.

Applications that already provide Material system tokens can combine the bridge
and full component layer:

```css
@import '@rcarls/rc-theme-material/bridge.css';
@import '@rcarls/rc-theme-material/components.css';
```

Selective entries such as
`@rcarls/rc-theme-material/components/select.css` and
`@rcarls/rc-theme-material/components/menu.css` are available when an
application uses only part of the collection.

The bridge maps Material component tokens first, then Material system roles,
then platform colors:

```css
--rc-slider-progress-background:
  var(--md-slider-active-track-color, var(--md-sys-color-primary, Highlight));
```

It covers select, combobox, slider, range slider, search bar, app bar, menu,
menu button, menubar, and toolbar. Search and top-app-bar mappings follow M3
terminology where Material Web does not expose an equivalent web component.
The initial mapping targets Material Web's `v0_192` component-token generation;
future mapping changes are versioned package API.
The package changes styling only; it does not claim Material behavioral or
structural conformance. It styles native controls only when an RC composition
establishes their intent, such as menu items, toolbar controls, app-bar actions,
and disclosure summaries. Unrelated application controls remain consumer-owned.

Package CSS uses the ordered layers `rc-theme-material.defaults`,
`rc-theme-material.bridge`, and `rc-theme-material.components`. Unlayered
application CSS can override the package normally.

## Material fidelity

| Surface | Fidelity | Notes |
| --- | --- | --- |
| Select, combobox, listbox, menus, search, app bar, sliders | Strong | Existing public parts and states support recognizable M3 styling. |
| Toolbar, transfer list, textarea, splitter, dialog, disclosure | Approximate | Styles follow M3 roles while retaining RC structure. |
| Markdown editor and virtual canvas | Foundational | Surface and contextual state treatment only. |

The CSS-only layer intentionally omits floating labels, supporting/error-text
structures, ripples, Material button variants, and structural component
variants. It bundles no fonts or icons; applications can optionally load Roboto
and Material Symbols themselves.

## Token direction

The component token contract stays semantic first:

- Component defaults continue to fall back to CSS system colors.
- Shared tokens cover common control color, padding, radius, border, focus,
  disabled, motion, and typography needs.
- Component-specific tokens are used only for geometry that does not fit a
  shared control token.
