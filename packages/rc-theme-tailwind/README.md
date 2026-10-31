# `@rcarls/rc-theme-tailwind`

Tailwind CSS v4 token bridge and calm SaaS reference theme for `rc-webcomponents` layouts.

Docs: [https://richardcarls.github.io/rc-webcomponents/guide/theme-previews](https://richardcarls.github.io/rc-webcomponents/guide/theme-previews).

It is CSS-only and has no Tailwind runtime dependency. The bridge consumes the
Tailwind v4 `--color-*`, `--font-*`, `--radius-*`, `--shadow-*`, and
`--ease-*` theme variables and maps them to the public `--rc-*` semantic
contract. Without Tailwind, it supplies calm SaaS defaults with a cyan accent
fallback, neutral surfaces, compact controls, system-color fallbacks, and
component polish rules.

## Installation

```sh
yarn add @rcarls/rc-theme-tailwind
```

## Full reference theme

Import the full theme bundle:

```css
@import '@rcarls/rc-theme-tailwind/theme.css';
```

Apply the theme class to your app shell or any subtree:

```html
<main class="rc-theme-tailwind">
  <rc-select>...</rc-select>
  <rc-dialog>...</rc-dialog>
</main>
```

## Build your own theme from it

The bridge is token-first. Import it after your Tailwind v4 theme variables and
override the Tailwind tokens at your theme boundary:

```css
@import '@rcarls/rc-theme-tailwind/bridge.css';
@import '@rcarls/rc-theme-tailwind/components.css';

.my-product-theme {
  --color-cyan-600: oklch(58% 0.19 220);
  --color-slate-950: oklch(20% 0.03 260);
  --radius-lg: 0.75rem;
  --font-sans: Inter, system-ui, sans-serif;
}
```

### Layer order with Tailwind

Cascade layers sort in the order they are first declared. Importing this theme
before Tailwind puts every `rc-*` layer below Tailwind's `base` layer, so
Preflight's resets (such as the universal `margin: 0` that undoes a modal
dialog's centering) override component structure. Importing it after Tailwind
puts the theme above Tailwind's utilities instead. Import `layers.css` first
so the `rc-*` layers sit after `base` and before `components` and `utilities`:

```css
@import '@rcarls/rc-theme-tailwind/layers.css';
@import '@rcarls/rc-theme-tailwind/bridge.css';
@import '@rcarls/rc-theme-tailwind/components.css';
@import 'tailwindcss';
```

Your own `@layer components` rules and utility classes still override the theme.

If your Tailwind theme uses a different palette, set the documented
`--color-*` tokens (or override the resulting `--rc-*` semantic tokens) at the
same boundary. No utility classes or Tailwind build step are required by this
package.

Selective component styles are exported for apps that want only part of the
reference layer:

```css
@import '@rcarls/rc-theme-tailwind/bridge.css';
@import '@rcarls/rc-theme-tailwind/components/select.css';
@import '@rcarls/rc-theme-tailwind/components/dialog.css';
```

Native HTML can opt into the same presentation without registering an RC
element. Import the defaults and bridge when needed, then opt into the native
layer and CSS-only recipes:

```css
@import '@rcarls/rc-theme-tailwind/defaults.css';
@import '@rcarls/rc-theme-tailwind/bridge.css';
@import '@rcarls/rc-theme-tailwind/native.css';
@import '@rcarls/rc-theme-tailwind/css-components.css';
```

`native.css` is an optional convenience layer for styling ordinary buttons,
text fields, selects, textareas, checkboxes, radios, ranges, and progress
controls throughout `.rc-theme-tailwind`. Component recipes style native
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

The theme includes stable CSS hooks for apps that opt into View Transitions,
but it does not start transitions or require browser support:

```css
.rc-theme-tailwind [data-rc-view-transition='panel'] {
  --rc-view-transition-name: rc-panel;
}
```

Application code remains responsible for deciding when to call
`document.startViewTransition()`.
