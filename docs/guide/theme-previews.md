# Theme previews

The component pages show rc components in their default appearance or with the
packaged Material 3 theme applied. The preview controls do not theme the
VitePress chrome and do not write tokens to `document.documentElement`.

The navigation bar has two preview controls:

- **Preview theme** switches between default component appearance and
  `@rcarls/rc-theme-material`.
- **Preview mode** switches the preview scopes between inherited color mode,
  forced light mode, and forced dark mode.

<ClientOnly>
  <theme-preview></theme-preview>
</ClientOnly>

## How it works

Component-page live examples keep the shared `.demo-section` wrapper as a
behavior hook only. The global preview controller reapplies the selected preview
state after client-side navigation. When Material is active, it adds
`.rc-theme-material` to demo scopes so the package's scoped `--md-*` defaults
and component styles apply.

The `Auto` mode leaves `color-scheme` unset so previews inherit the current page
or browser mode. The `Light` and `Dark` modes set `color-scheme` only on demo
scopes and `<theme-preview>`, leaving the docs shell unchanged.

The preview gallery owns an open shadow root. It always uses a small neutral
layout stylesheet for the gallery itself. The Material option additionally
adopts `@rcarls/rc-theme-material/theme.css`, which combines bundled scoped
Material token defaults, the token bridge, and the full component style layer.

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
It combines bundled light/dark token defaults with the bridge and full component
styles. Import `defaults.css` separately only when those scoped token defaults
are useful without the RC mappings.

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
--rc-slider-progress-background: var(
  --md-slider-active-track-color,
  var(--md-sys-color-primary, Highlight)
);
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

| Surface                                                        | Fidelity     | Notes                                                             |
| -------------------------------------------------------------- | ------------ | ----------------------------------------------------------------- |
| Select, combobox, listbox, menus, search, app bar, sliders     | Strong       | Existing public parts and states support recognizable M3 styling. |
| Toolbar, transfer list, textarea, splitter, dialog, disclosure | Approximate  | Styles follow M3 roles while retaining RC structure.              |
| Markdown editor and virtual canvas                             | Foundational | Surface and contextual state treatment only.                      |

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
