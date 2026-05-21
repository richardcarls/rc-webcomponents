<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  document.addEventListener('rc-app-bar-scroll', (e) => {
    console.log('rc-app-bar-scroll:', e.detail);
  });
});

function setScrolled(value) {
  document.getElementById('controlled-bar').scrolled = value;
}
</script>

<style scoped>
.app-bar-frame {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  overflow: clip;
}

.app-bar-scroll {
  height: 200px;
  overflow-y: auto;
}

.app-bar-scroll article {
  padding: 1rem;
}

.app-bar-frame rc-app-bar button.icon {
  display: inline-grid;
  place-items: center;
  inline-size: 40px;
  block-size: 40px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: none;
  color: inherit;
  font-size: 1.1rem;
  cursor: pointer;
}

.app-bar-frame rc-app-bar button.icon:hover {
  background: color-mix(in srgb, currentColor 10%, transparent);
}

.app-bar-frame rc-app-bar [slot='expanded-title'] {
  margin: 0;
  font-size: inherit;
  font-weight: 500;
  line-height: 1.2;
  border: none;
  padding: 0;
}

.app-bar-frame rc-search-bar input[type='search'] {
  background: transparent;
  border: none;
  outline: none;
  font: inherit;
  color: inherit;
}
</style>

# rc-app-bar

A Material-style top app bar: a structural layout row for a leading nav
control, a title region, and trailing actions, with an optional expanded title
row (`variant="medium"`) that collapses when the associated scroll container
scrolls. Headless by design — system-color defaults, no landmark role, and all
content stays in light DOM via slots.

[Material 3 Top App Bar (modeled pattern)](https://m3.material.io/components/top-app-bar/overview)

<AtAGlance
  package-name="@rcarls/rc-app-bar"
  tag="rc-app-bar"
  native="Structural slots only; consumer provides all controls and the landmark wrapper"
  state="Controlled or uncontrolled scrolled state"
  :events="['rc-app-bar-scroll']"
  :related="[
    { label: 'rc-search-bar', href: '/components/rc-search-bar' },
    { label: 'rc-toolbar', href: '/components/rc-toolbar' }
  ]"
/>

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-app-bar
```

```sh [yarn]
yarn add @rcarls/rc-app-bar
```

:::

```js
import '@rcarls/rc-app-bar/define';
```

## Small app bar with scroll elevation

Point `scroll-target` at the scroll container (a CSS selector, or the keyword
`window`; element references go through the `scrollTarget` property). When the
container scrolls past `scroll-threshold`, the bar sets `data-scrolled` and the
`scrolled` custom state, and fires `rc-app-bar-scroll`.

<ClientOnly>
<div class="demo-section">
  <div class="app-bar-frame">
    <header>
      <rc-app-bar scroll-target="#docs-small-scroll">
        <button slot="leading" class="icon" aria-label="Back">&larr;</button>
        <span>Inbox</span>
        <button slot="trailing" class="icon" aria-label="Search">&#128269;</button>
      </rc-app-bar>
    </header>
    <div class="app-bar-scroll" id="docs-small-scroll">
      <article>
        <p>Scroll this area to elevate the app bar.</p>
        <p style="block-size: 40rem"></p>
        <p>End of content.</p>
      </article>
    </div>
  </div>
</div>
</ClientOnly>

```html
<header>
  <rc-app-bar scroll-target="#content">
    <button slot="leading" aria-label="Back">&larr;</button>
    <span>Inbox</span>
    <rc-toolbar slot="trailing" label="Actions">…</rc-toolbar>
  </rc-app-bar>
</header>
<div id="content" class="scroll-area">…</div>
```

Style the scrolled state from outside via the attribute or the custom state:

```css
rc-app-bar[data-scrolled] {
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.2);
}

/* equivalent */
rc-app-bar:state(scrolled) {
  box-shadow: 0 1px 4px rgb(0 0 0 / 0.2);
}
```

## Medium variant: collapsible expanded title

`variant="medium"` shows the `expanded-title` row until the container scrolls,
then collapses the title inline. Provide the title in **both** the default
slot and `expanded-title` — the bar keeps exactly one exposed to assistive
technology at a time, so it is announced once.

<ClientOnly>
<div class="demo-section">
  <div class="app-bar-frame">
    <header>
      <rc-app-bar variant="medium" scroll-target="#docs-medium-scroll">
        <button slot="leading" class="icon" aria-label="Back">&larr;</button>
        <span>Slow-Roasted Tomato Pasta</span>
        <button slot="trailing" class="icon" aria-label="Edit">&#9998;</button>
        <h2 slot="expanded-title">Slow-Roasted Tomato Pasta</h2>
      </rc-app-bar>
    </header>
    <div class="app-bar-scroll" id="docs-medium-scroll">
      <article>
        <p>Scroll to collapse the expanded title into the bar row.</p>
        <p style="block-size: 40rem"></p>
        <p>End of content.</p>
      </article>
    </div>
  </div>
</div>
</ClientOnly>

```html
<rc-app-bar variant="medium" scroll-target="#content">
  <button slot="leading" aria-label="Back">&larr;</button>
  <span>Slow-Roasted Tomato Pasta</span>
  <rc-toolbar slot="trailing" label="Actions">…</rc-toolbar>
  <h1 slot="expanded-title">Slow-Roasted Tomato Pasta</h1>
</rc-app-bar>
```

## Search layout by composition

There is no search variant — slot an [rc-search-bar](/components/rc-search-bar)
(wrapping a native `<input type="search">`) into the default title region of a
small bar.

<ClientOnly>
<div class="demo-section">
  <div class="app-bar-frame">
    <header>
      <rc-app-bar>
        <button slot="leading" class="icon" aria-label="Back">&larr;</button>
        <rc-search-bar placeholder="Search 51 recipes">
          <span slot="leading" aria-hidden="true">&#128269;</span>
          <input type="search" aria-label="Search 51 recipes" />
        </rc-search-bar>
        <button slot="trailing" class="icon" aria-label="New recipe">&plus;</button>
      </rc-app-bar>
    </header>
  </div>
</div>
</ClientOnly>

```html
<rc-app-bar>
  <button slot="leading" aria-label="Back">&larr;</button>
  <rc-search-bar placeholder="Search 51 recipes">
    <input type="search" aria-label="Search 51 recipes" />
  </rc-search-bar>
  <rc-toolbar slot="trailing" label="Actions">…</rc-toolbar>
</rc-app-bar>
```

## Controlled scrolled state

Assign the `scrolled` property to drive the state from application code. Host
writes are silent (no events) and detach the scroll observer; assign
`undefined` to release back to observation. The `data-scrolled` attribute is
state **output** for CSS — writing it yourself has no effect on behavior.

<ClientOnly>
<div class="demo-section">
  <div class="app-bar-frame">
    <rc-app-bar id="controlled-bar">
      <span>Controlled bar</span>
    </rc-app-bar>
  </div>
  <div class="demo-row" style="margin-top:0.75em;">
    <button @click="setScrolled(true)">scrolled = true</button>
    <button @click="setScrolled(false)">scrolled = false</button>
    <button @click="setScrolled(undefined)">release (undefined)</button>
  </div>
</div>
</ClientOnly>

```js
const bar = document.querySelector('rc-app-bar');

bar.scrolled = true;      // controlled: applied silently, observer detached
bar.scrolled = undefined; // released: observer drives the state again

bar.addEventListener('rc-app-bar-scroll', (e) => {
  console.log(e.detail); // { scrolled: true } — uncontrolled mode only
});
```

## Accessibility

- **No implicit landmark.** Wrap the page-level bar in `<header>` for the
  banner landmark. Secondary instances (one bar per split pane, for example)
  should not be banners — leave them in plain containers or `<nav>` as
  appropriate.
- In `variant="medium"`, the inactive title copy is `aria-hidden` and
  `visibility: hidden`, so the title is announced once and collapsed content
  is unfocusable.
- Collapse and fade transitions are disabled under
  `prefers-reduced-motion: reduce`.
- The default scrolled visual is a `GrayText` divider, which survives dark
  mode and `forced-colors: active` without relying on color alone.

## API

<ApiTable tag="rc-app-bar" />
