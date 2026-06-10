<script setup>
import { ref } from 'vue';

const lastClicked = ref('');
function logClick(label) {
  lastClicked.value = label;
}
</script>

# rc-toolbar

An ARIA toolbar with roving tabindex. Groups related controls and provides keyboard navigation: Arrow keys move between focusable items, non-focusable elements like `<hr>` separators are skipped automatically.

[WAI-ARIA Toolbar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)

<AtAGlance
  package-name="@rcarls/rc-toolbar"
  tag="rc-toolbar"
  native="Uses consumer-provided buttons and controls"
  state="Active item managed by roving tabindex"
  :events="[]"
  :related="[
    { label: 'rc-menubar', href: '/components/rc-menubar' }
  ]"
/>

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-toolbar
```

```sh [yarn]
yarn add @rcarls/rc-toolbar
```

:::

```js
import '@rcarls/rc-toolbar/define';
```

## Basic toolbar

<ClientOnly>
<div class="demo-section">
  <rc-toolbar label="Formatting">
    <button @click="logClick('Bold')">Bold</button>
    <button @click="logClick('Italic')">Italic</button>
    <button @click="logClick('Underline')">Underline</button>
    <button @click="logClick('Strike')" disabled>Strike</button>
  </rc-toolbar>
  <p v-if="lastClicked" style="margin:0.5rem 0 0;font-size:0.875rem;color:var(--vp-c-text-2);">Clicked: {{ lastClicked }}</p>
</div>
</ClientOnly>

```html
<rc-toolbar label="Formatting">
  <button>Bold</button>
  <button>Italic</button>
  <button>Underline</button>
  <button disabled>Strike</button>
</rc-toolbar>
```

## Mixed items with separator

Non-focusable elements like `<hr>` render as visual separators but are skipped during keyboard navigation.

<ClientOnly>
<div class="demo-section">
  <rc-toolbar label="Text formatting">
    <button @click="logClick('Bold')">Bold</button>
    <button @click="logClick('Italic')">Italic</button>
    <button @click="logClick('Underline')">Underline</button>
    <hr aria-hidden="true" />
    <button @click="logClick('Align left')">Align left</button>
    <button @click="logClick('Align center')">Align center</button>
    <button @click="logClick('Align right')">Align right</button>
    <hr aria-hidden="true" />
    <button @click="logClick('Insert table')" disabled>Insert table</button>
  </rc-toolbar>
  <p v-if="lastClicked" style="margin:0.5rem 0 0;font-size:0.875rem;color:var(--vp-c-text-2);">Clicked: {{ lastClicked }}</p>
</div>
</ClientOnly>

```html
<rc-toolbar label="Text formatting">
  <button>Bold</button>
  <button>Italic</button>
  <hr aria-hidden="true" />
  <button>Align left</button>
  <button>Align center</button>
  <hr aria-hidden="true" />
  <button disabled>Insert table</button>
</rc-toolbar>
```

## Vertical orientation

<ClientOnly>
<div class="demo-section">
  <rc-toolbar orientation="vertical" label="Actions">
    <button @click="logClick('Cut')">Cut</button>
    <button @click="logClick('Copy')">Copy</button>
    <button @click="logClick('Paste')">Paste</button>
    <hr aria-hidden="true" />
    <button @click="logClick('Undo')">Undo</button>
    <button @click="logClick('Redo')">Redo</button>
  </rc-toolbar>
</div>
</ClientOnly>

```html
<rc-toolbar orientation="vertical" label="Actions">
  <button>Cut</button>
  <button>Copy</button>
  <hr aria-hidden="true" />
  <button>Undo</button>
  <button>Redo</button>
</rc-toolbar>
```

## Material bridge

`@rcarls/rc-theme-material` maps Material-inspired surface shape and spacing
into this component. It does not choose appearances for consumer-provided
buttons. See [Theme previews](/guide/theme-previews).

## API

<ApiTable tag="rc-toolbar" />
