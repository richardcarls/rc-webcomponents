# Theme previews

The examples throughout the component pages use default UA-oriented styling so
behavior, labels, form participation, and keyboard support stay easy to inspect.
This page shows the same rc components inside docs-only theme previews inspired
by popular design systems.

The selector in the sidebar changes the previews on this page and the live demo
blocks on component pages. It does not write tokens to
`document.documentElement`, and it does not theme the VitePress chrome.

<ClientOnly>
  <theme-preview></theme-preview>
</ClientOnly>

## How it works

The preview element owns an open shadow root and applies a base preview
stylesheet plus the selected design-system-inspired stylesheet through
`shadowRoot.adoptedStyleSheets`.

The preview themes are intentionally illustrative. They are not official
Material, iOS, Fluent, or Carbon implementations, and they are not exported by
the component packages. They demonstrate how a consuming application can map its
own design tokens onto the public `--rc-*` token surface.

## Token direction

The component token contract stays semantic first:

- Component defaults continue to fall back to CSS system colors.
- Shared tokens cover common control color, padding, radius, border, focus,
  disabled, motion, and typography needs.
- Component-specific tokens are used only for geometry that does not fit a
  shared control token.
