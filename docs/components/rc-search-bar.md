<script setup>
import { onMounted, ref } from 'vue';

const lastEvent = ref('—');

onMounted(() => {
  document.addEventListener('rc-search-bar-input', (e) => {
    lastEvent.value = `rc-search-bar-input ${JSON.stringify(e.detail)}`;
  });
  document.addEventListener('rc-search-bar-clear', () => {
    lastEvent.value = 'rc-search-bar-clear';
  });
});
</script>

<style scoped>
.demo-section rc-search-bar {
  inline-size: min(24rem, 100%);
  --rc-search-bar-radius: 1.5rem;
}

/* Recommended slotted-input reset: the wrapper provides the chrome. */
.demo-section rc-search-bar input[type='search'] {
  background: transparent;
  border: none;
  outline: none;
  font: inherit;
  color: inherit;
}

/* Hide the native WebKit cancel button in favor of the shadow clear button. */
.demo-section rc-search-bar input[type='search']::-webkit-search-cancel-button {
  -webkit-appearance: none;
  display: none;
}
</style>

# rc-search-bar

Enhances a consumer-provided native `<input type="search">` with leading icon
chrome, an accessible clear button, and debounced search events. The native
input is **required** and stays in light DOM as the source of truth — form
submission, label association, and pre-upgrade behavior are preserved.

[Native search input on MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/search)

<AtAGlance
  package-name="@rcarls/rc-search-bar"
  tag="rc-search-bar"
  native="Requires a native input[type=search] child"
  state="Controlled or uncontrolled value"
  :events="['rc-search-bar-input', 'rc-search-bar-clear']"
  :related="[
    { label: 'Progressive enhancement', href: '/guide/progressive-enhancement' },
    { label: 'rc-app-bar', href: '/components/rc-app-bar' }
  ]"
/>

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-search-bar
```

```sh [yarn]
yarn add @rcarls/rc-search-bar
```

:::

```js
import '@rcarls/rc-search-bar/define';
```

## Basic search bar

Type to see the debounced `rc-search-bar-input` event (default 200 ms); the
clear button appears when the input has a value, fires `rc-search-bar-clear`
plus an immediate empty `rc-search-bar-input`, and returns focus to the input.

<ClientOnly>
<div class="demo-section">
  <search>
    <rc-search-bar placeholder="Search 51 recipes">
      <span slot="leading" aria-hidden="true">&#128269;</span>
      <input type="search" name="q" aria-label="Search 51 recipes" />
    </rc-search-bar>
  </search>
  <p style="margin-top:0.75em;">Last event: <code>{{ lastEvent }}</code></p>
</div>
</ClientOnly>

```html
<search>
  <rc-search-bar placeholder="Search 51 recipes">
    <span slot="leading" aria-hidden="true">🔍</span>
    <input type="search" name="q" aria-label="Search 51 recipes" />
  </rc-search-bar>
</search>
```

```js
document.querySelector('rc-search-bar').addEventListener(
  'rc-search-bar-input',
  (e) => console.log(e.detail.value),
);
```

Recommended consumer CSS — the shadow wrapper provides the field chrome, so
strip the slotted input's own (shadow CSS cannot style light-DOM content):

```css
rc-search-bar input[type='search'] {
  background: transparent;
  border: none;
  outline: none;
  font: inherit;
  color: inherit;
}

/* Optional: hide the native WebKit cancel button in favor of the
   component's clear button. If left visible, it clears through the normal
   input path (a debounced empty rc-search-bar-input) and never fires
   rc-search-bar-clear. */
rc-search-bar input[type='search']::-webkit-search-cancel-button {
  -webkit-appearance: none;
  display: none;
}
```

## Label association

The input stays in light DOM, so every native labeling strategy keeps working:
`label[for]`, a wrapping `<label>`, or `aria-label` on the input. The
component writes no ARIA to the input — `type="search"` already exposes the
`searchbox` role.

<ClientOnly>
<div class="demo-section">
  <label for="docs-labeled-search" style="display:block; margin-bottom:0.5em;">Search recipes</label>
  <rc-search-bar>
    <input type="search" id="docs-labeled-search" />
  </rc-search-bar>
</div>
</ClientOnly>

```html
<label for="q">Search recipes</label>
<rc-search-bar>
  <input type="search" id="q" name="q" />
</rc-search-bar>
```

## Controlled and uncontrolled value

- **Uncontrolled** — the input (and the user) own the value. Optionally seed
  it with `default-value`; an author `value` attribute on the input wins over
  `default-value`.
- **Controlled** — assign the `value` property. Host writes are silent (no
  events) and win over slotted author values. User interaction always
  dispatches events.

<ClientOnly>
<div class="demo-section">
  <rc-search-bar default-value="initial hint">
    <input type="search" aria-label="Seeded with default-value" />
  </rc-search-bar>
</div>
</ClientOnly>

```js
const bar = document.querySelector('rc-search-bar');

bar.value = 'tomato'; // silent: no rc-search-bar-input fires
console.log(bar.value); // reads from the native input
```

## API

<ApiTable tag="rc-search-bar" />
