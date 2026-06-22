# `@rcarls/rc-fab`

A sticky-positioned button over page content with scroll behaviors, adapted from
the [Material Design FAB component](https://m3.material.io/components/floating-action-button/overview).

Use this for "back to top", sticky CTAs, chat launchers, and of course as FABs in your
Material Design website or PWA.

Place a native `<button>` as the direct child. The button's own accessible name (text
content or `aria-label`) becomes the FAB's accessible name.

Icons go inside the button alongside or instead of visible text.

## Installation

```sh
npm install @rcarls/rc-fab
```

```js
import '@rcarls/rc-fab/define';
```

## Usage

```html
<!-- Back to top (scroll-triggered) -->
<rc-fab scroll-reveal>
  <button type="button" aria-label="Back to top"
          onclick="scrollTo({ top: 0, behavior: 'smooth' })">
    <span aria-hidden="true">↑</span>
  </button>
</rc-fab>

<!-- Always-visible action -->
<rc-fab>
  <button type="button" aria-label="Create">
    <span class="material-symbols-outlined" aria-hidden="true">add</span>
  </button>
</rc-fab>

<!-- Extended FAB (icon + visible label) -->
<rc-fab>
  <button type="button">
    <span class="material-symbols-outlined" aria-hidden="true">edit</span>
    Compose
  </button>
</rc-fab>
```

## Key attributes and CSS custom properties

| Attribute / property | Description |
| --- | --- |
| `position` | Viewport corner: `bottom-end` (default), `bottom-start`, `top-end`, `top-start` |
| `scroll-reveal` | Reveal the FAB only after scrolling past `--rc-fab-scroll-threshold` |

| CSS custom property | Default | Description |
| --- | --- | --- |
| `--rc-fab-position` | `fixed` | CSS position value. Use `absolute` for layout-relative placement |
| `--rc-fab-scroll-threshold` | `300px` | Scroll distance before the FAB appears (requires `scroll-reveal`) |
| `--rc-fab-scroll-timeline` | `scroll(root block)` | Override scroll target for the CSS animation path (e.g. `scroll(nearest block)`) |
| `--rc-fab-radius` | `9999px` | Border-radius. Default is pill-shaped. Use `50%` for a circle or `1rem` for Material rounded-square |
| `--rc-fab-size` | `3.5rem` | Height and minimum width |
| `--rc-fab-bg` | `ButtonFace` | Button background colour |
| `--rc-fab-color` | `ButtonText` | Button foreground colour |
| `--rc-fab-shadow` | `none` | Elevation shadow |
| `--rc-fab-inset-block` | `1.5rem` | Distance from the block-axis edge |
| `--rc-fab-inset-inline` | `1.5rem` | Distance from the inline-axis edge |

## Scroll-reveal behaviour

`scroll-reveal` uses CSS scroll-driven animations (`animation-timeline: scroll()`).

In browsers that do not yet support this API, a passive scroll listener provides
equivalent behaviour.

The `[scroll-below-threshold]` attribute is toggled on the host and CSS transitions
handle the show/hide. The FAB is always visible in any remaining edge cases.

When the button receives `focus-visible` while below the threshold the animation is
overridden and the FAB is shown fully.

## Accessibility

- The button's `aria-label` or text content is its accessible name.
- Decorative icon content should use `aria-hidden="true"`.
- The component does not choose a semantic landmark role or page position.
- With `scroll-reveal`, the FAB is removed from the accessibility tree and tab
  order while hidden, matching the expectation that invisible controls are
  unreachable.
- The `50%` point in the reveal animation lifts `visibility: hidden` early so
  keyboard users can reach the button as it starts fading in.
