# `@rcarls/rc-app-bar`

A headless app bar with leading, title, exact-center, and trailing regions.
It uses a single consumer-owned title element and supports pinned, continuously
collapsing, and direction-sensitive hide-on-scroll behavior.

Material 3 and Apple HIG inform the available structures and behaviors, but the
default appearance remains deliberately UA-like: system colors, a thin
scrolled divider, and no supplied action controls or decorative icons.

## Installation

```bash
npm install @rcarls/rc-app-bar
```

```js
import '@rcarls/rc-app-bar/define';
```

## Basic usage

```html
<header>
  <rc-app-bar scroll-target="#content">
    <button slot="leading" aria-label="Back">&larr;</button>
    <span>Inbox</span>
    <rc-toolbar slot="trailing" label="Actions">...</rc-toolbar>
  </rc-app-bar>
</header>
<div id="content" class="scroll-area">...</div>
```

The default slot is the single title region. It may contain a title, subtitle,
or any other consumer markup. The title node remains connected and is never
duplicated while the bar changes layout.

## Expanded and scroll behaviors

`variant="expanded"` places the title in a flexible second row. Its height
comes from the title content rather than a Material-specific fixed size.

```html
<rc-app-bar
  variant="expanded"
  scroll-behavior="collapse"
  scroll-target="#content"
>
  <button slot="leading" aria-label="Back">&larr;</button>
  <div>
    <strong>Slow-Roasted Tomato Pasta</strong>
    <small>Summer recipes</small>
  </div>
  <button slot="trailing" aria-label="Edit">Edit</button>
</rc-app-bar>
```

Scroll behaviors are exclusive:

- `pinned` keeps the current structure visible and only exposes scrolled state.
- `collapse` continuously shrinks an expanded title row over its measured
  height, then keeps the compact row visible.
- `hide` hides the complete bar while scrolling down past `scroll-threshold`
  and reveals it when scrolling up or returning near the top.

The component never consumes, stops, or rewrites the document's scroll.

## Exact-center composition

The optional `center` slot remains at the host's geometric midpoint even when
leading and trailing controls have different widths. This is useful for
desktop controls or an [`rc-search-bar`](../rc-search-bar/):

```html
<rc-app-bar>
  <button slot="leading">Back</button>
  <span>Recipes</span>
  <rc-search-bar slot="center" placeholder="Search recipes">
    <input type="search" aria-label="Search recipes" />
  </rc-search-bar>
  <button slot="trailing" aria-label="Account">Account</button>
</rc-app-bar>
```

Title and center content may coexist. The title is constrained before it can
overlap the centered content. Without center content, the title uses all space
between leading and trailing controls; consumers may apply
`rc-app-bar::part(title) { text-align: center; }`.

## Controlled state

`scrolled` follows the library's controlled/uncontrolled convention:

- Set `scrollTarget` or `scroll-target` for uncontrolled observation.
- Assign `scrolled` to control the endpoint silently.
- Assign `undefined` to release control back to observation.

In controlled collapse mode, `true` snaps to compact and `false` restores the
expanded row. Controlled hide mode remains visible because a boolean value
cannot express scroll direction.

State output is available as `data-scrolled`, `data-collapsed`, and
`data-hidden`, with equivalent `:state(scrolled)`, `:state(collapsed)`, and
`:state(hidden)` custom states.

## View Transitions

Document View Transitions are consumer-owned progressive enhancement. Assign a
unique `view-transition-name` to the light-DOM title element, not
`::part(title)` or the shadow-owned slot wrapper:

```html
<rc-app-bar id="recipe-bar" variant="expanded" scroll-behavior="collapse">
  <h1 class="recipe-title">Slow-Roasted Tomato Pasta</h1>
</rc-app-bar>
```

```css
.recipe-title {
  view-transition-name: recipe-app-bar-title;
}

::view-transition-old(recipe-app-bar-title) {
  animation: 180ms ease-out both title-out;
}

::view-transition-new(recipe-app-bar-title) {
  animation: 180ms 120ms ease-in both title-in;
}

@keyframes title-out {
  to {
    opacity: 0;
    translate: 0 -1rem;
  }
}

@keyframes title-in {
  from {
    opacity: 0;
  }
}
```

```js
const bar = document.querySelector('#recipe-bar');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

async function setCollapsed(collapsed) {
  const update = async () => {
    bar.scrolled = collapsed;
    await bar.updateComplete;
  };

  if (!document.startViewTransition || reduceMotion.matches) {
    await update();
    return;
  }

  document.startViewTransition(update);
}
```

The app bar never starts a document transition itself because the API is
global and may conflict with navigation or unrelated components. Unsupported
browsers receive the immediate endpoint change. Give concurrently rendered
titles unique transition names.

## Styling

The component supplies no controls or action icons. The default scrolled
separator is the `scroll-shadow` part, despite being rendered as a system-color
border by default:

```css
rc-app-bar::part(scroll-shadow) {
  border-block-end: 0;
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.2);
}

rc-app-bar.glass::part(root) {
  background: color-mix(in srgb, Canvas 70%, transparent);
  backdrop-filter: blur(18px);
}
```

### CSS custom properties

| Property | Default | Description |
| --- | --- | --- |
| `--rc-app-bar-bg` | `Canvas` | Bar background |
| `--rc-app-bar-color` | `CanvasText` | Bar text color |
| `--rc-app-bar-compact-min-height` | `3rem` | Compact row minimum height |
| `--rc-app-bar-expanded-padding-block` | `0.75em` | Expanded title block padding |
| `--rc-app-bar-padding-inline` | `0.75em` | Horizontal padding |
| `--rc-app-bar-gap` | `0.5em` | Gap between regions |
| `--rc-app-bar-transition-duration` | `200ms` | Endpoint and hide transition duration |
| `--rc-app-bar-scroll-shadow` | `1px solid GrayText` | Scrolled separator border |

### CSS parts

`root`, `leading`, `title`, `center`, `trailing`, `scroll-shadow`

## Breaking migration

- Replace `variant="small"` with `variant="compact"`.
- Replace `variant="medium"` with `variant="expanded"`.
- Remove `slot="expanded-title"` and keep one title in the default slot.
- Replace old fixed height/title-font tokens and the `title-row`/`expanded`
  parts with the structural API documented above.

## Accessibility

- The host has no implicit landmark role. Wrap a page-level instance in
  `<header>` when appropriate.
- Consumer-provided controls retain their native semantics and keyboard
  behavior.
- The single title remains connected and exposed to assistive technology in
  every visual state.
- Movement and fades are disabled under `prefers-reduced-motion: reduce`.
- The default divider uses `GrayText` and remains visible in forced colors.
