<script setup>
function setScrolled(value) {
  document.getElementById('docs-controlled-bar').scrolled = value;
}

function transitionTitle() {
  const bar = document.getElementById('docs-transition-bar');
  const update = async () => {
    bar.scrolled = !bar.scrolled;
    await bar.updateComplete;
  };

  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update();
    return;
  }

  document.startViewTransition(update);
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

.title-stack {
  display: grid;
  gap: 0.2rem;
}

.title-stack > * {
  margin: 0;
}

.app-bar-frame rc-search-bar {
  inline-size: min(20rem, 40vw);
}

.docs-transition-title {
  view-transition-name: docs-app-bar-title;
}
</style>

<style>
::view-transition-old(docs-app-bar-title) {
  animation: 180ms ease-out both docs-title-out;
}

::view-transition-new(docs-app-bar-title) {
  animation: 180ms 120ms ease-in both docs-title-in;
}

@keyframes docs-title-out {
  to {
    opacity: 0;
    translate: 0 -1rem;
  }
}

@keyframes docs-title-in {
  from { opacity: 0; }
}
</style>

# rc-app-bar

A headless grid app bar with leading, single-title, exact-center, and trailing
regions. It supports pinned, continuously collapsing, and direction-sensitive
hide-on-scroll behavior while keeping all consumer content in light DOM.

Material 3 and Apple HIG inform its structures and behavior, but its defaults
remain UA-like: system colors, a thin divider, and no supplied controls,
decorative icons, typography, shadows, or glass effects.

<AtAGlance
  package-name="@rcarls/rc-app-bar"
  tag="rc-app-bar"
  native="Structural slots only; consumer supplies controls, icons, and landmark wrapper"
  state="Controlled or uncontrolled scrolled state"
  :events="['rc-app-bar-scroll']"
  :related="[
    { label: 'rc-search-bar', href: '/components/rc-search-bar' },
    { label: 'rc-toolbar', href: '/components/rc-toolbar' }
  ]"
/>

## Installation

```sh
yarn add @rcarls/rc-app-bar
```

```js
import '@rcarls/rc-app-bar/define';
```

## Compact app bar

The default slot is the single title region. The title remains connected and
accessible in every visual state.

```html
<header>
  <rc-app-bar scroll-target="#content">
    <button slot="leading" aria-label="Back">&larr;</button>
    <span>Inbox</span>
    <rc-toolbar slot="trailing" label="Actions">...</rc-toolbar>
  </rc-app-bar>
</header>
```

## Expanded continuous collapse

`variant="expanded"` adds a flexible title row sized from consumer content.
`scroll-behavior="collapse"` maps the first expanded-row-height of scrolling
to collapse progress without intercepting or rewriting scroll.

<ClientOnly>
<div class="demo-section">
  <div class="app-bar-frame">
    <header>
      <rc-app-bar variant="expanded" scroll-behavior="collapse" scroll-target="#docs-collapse-scroll">
        <button slot="leading" aria-label="Back">&larr;</button>
        <div class="title-stack"><strong>Slow-Roasted Tomato Pasta</strong><small>Summer recipes</small></div>
        <button slot="trailing">Edit</button>
      </rc-app-bar>
    </header>
    <div class="app-bar-scroll" id="docs-collapse-scroll">
      <article><p>Scroll to collapse the title.</p><p style="block-size: 40rem"></p></article>
    </div>
  </div>
</div>
</ClientOnly>

```html
<rc-app-bar
  variant="expanded"
  scroll-behavior="collapse"
  scroll-target="#content"
>
  <button slot="leading" aria-label="Back">&larr;</button>
  <div>
    <h1>Slow-Roasted Tomato Pasta</h1>
    <p>Summer recipes</p>
  </div>
  <button slot="trailing">Edit</button>
</rc-app-bar>
```

Use `scroll-behavior="hide"` to hide the complete bar while scrolling down
past `scroll-threshold` and reveal it on upward scrolling or near the top.
`pinned`, the default, keeps the current structure visible.

## Exact-center search

The optional center slot stays at the host's geometric midpoint even when the
leading and trailing controls have different widths. Title and center content
may coexist; the title is constrained before overlap.

<ClientOnly>
<div class="demo-section">
  <div class="app-bar-frame">
    <rc-app-bar>
      <button slot="leading">Back to all recipes</button>
      <span>Recipes</span>
      <rc-search-bar slot="center" placeholder="Search recipes">
        <input type="search" aria-label="Search recipes" />
      </rc-search-bar>
      <button slot="trailing">Me</button>
    </rc-app-bar>
  </div>
</div>
</ClientOnly>

```html
<rc-app-bar>
  <button slot="leading">Back to all recipes</button>
  <span>Recipes</span>
  <rc-search-bar slot="center" placeholder="Search recipes">
    <input type="search" aria-label="Search recipes" />
  </rc-search-bar>
  <button slot="trailing">Account</button>
</rc-app-bar>
```

Without center content, the title grows across all available space between
leading and trailing. Consumers may center its text with
`rc-app-bar::part(title) { text-align: center; }`.

## Controlled endpoints

Host writes to `scrolled` are silent. In controlled collapse mode, `true`
snaps to compact and `false` restores expanded. Assign `undefined` to release
control back to observation.

<ClientOnly>
<div class="demo-section">
  <div class="app-bar-frame">
    <rc-app-bar id="docs-controlled-bar" variant="expanded" scroll-behavior="collapse">
      <span>Controlled title</span>
    </rc-app-bar>
  </div>
  <div class="demo-row" style="margin-top:0.75em;">
    <button @click="setScrolled(true)">compact endpoint</button>
    <button @click="setScrolled(false)">expanded endpoint</button>
    <button @click="setScrolled(undefined)">release</button>
  </div>
</div>
</ClientOnly>

## Consumer-owned View Transitions

Level 1 document View Transitions target the consumer-owned light-DOM title.
Do not put `view-transition-name` on `::part(title)` or the shadow-owned slot
wrapper. Give every concurrently rendered title a unique name.

<ClientOnly>
<div class="demo-section">
  <div class="app-bar-frame">
    <rc-app-bar id="docs-transition-bar" variant="expanded" scroll-behavior="collapse">
      <span class="docs-transition-title">Transitioned title</span>
    </rc-app-bar>
  </div>
  <p><button @click="transitionTitle()">Toggle with View Transition</button></p>
</div>
</ClientOnly>

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
```

```js
const update = async () => {
  bar.scrolled = true;
  await bar.updateComplete;
};

if (document.startViewTransition &&
    !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.startViewTransition(update);
} else {
  update();
}
```

The component never starts a document transition itself because transitions
are global and may conflict with navigation or unrelated components.

## Styling and accessibility

- The host has no implicit landmark. Consumers own `<header>` and other
  landmark semantics.
- All controls and action icons are consumer-supplied.
- The `scroll-shadow` part defaults to a `GrayText` divider. Consumers may
  replace it with a shadow.
- Read `collapsed` to distinguish the fully collapsed endpoint from intermediate
  collapse progress. The live progress is exposed to CSS through the read-only
  `--rc-app-bar-collapse-progress` custom property.
- Use `--rc-app-bar-title-font-size` and
  `--rc-app-bar-expanded-title-font-size` for opt-in title typography, and
  `--rc-app-bar-scroll-divider` to replace the default scrolled divider.
- Consumers may style `root` with translucent backgrounds and
  `backdrop-filter` for a glass presentation.
- Motion is disabled under `prefers-reduced-motion: reduce`.
- State output is exposed as `data-scrolled`, `data-collapsed`, and
  `data-hidden`, plus equivalent custom states.

## Breaking migration

- `small` becomes `compact`; `medium` becomes `expanded`.
- Remove `slot="expanded-title"` and keep one title in the default slot.
- Replace old fixed Material size/font tokens and `title-row`/`expanded`
  parts with the structural API below.

## Material bridge

`@rcarls/rc-theme-material` maps M3 top-app-bar surface, title typography,
height, spacing, and scrolled-state roles into this component. The mapping is a
styling approximation and does not impose Material structure or behavior. See
[Theme previews](/guide/theme-previews) for integration details.

## API

<ApiTable tag="rc-app-bar" />
