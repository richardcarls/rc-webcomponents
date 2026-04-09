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

<style>
.tb-demo rc-toolbar {
  border: 1px solid ButtonBorder;
  border-radius: 4px;
  display: inline-flex;
}
.tb-demo rc-toolbar button {
  padding: 0.4em 0.8em;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 0.9rem;
  font: inherit;
}
.tb-demo rc-toolbar button:hover { background: color-mix(in srgb, currentColor 10%, transparent); }
.tb-demo rc-toolbar button:focus-visible { outline: 2px solid Highlight; outline-offset: -2px; }
.tb-demo rc-toolbar button:disabled { opacity: 0.4; cursor: not-allowed; }
.tb-demo rc-toolbar hr {
  margin: 0 0.25em;
  border: none;
  border-left: 1px solid ButtonBorder;
  height: 1.5em;
  align-self: center;
}
.tb-demo rc-toolbar[orientation="vertical"] { display: inline-flex; flex-direction: column; }
.tb-demo rc-toolbar[orientation="vertical"] hr {
  border-left: none;
  border-top: 1px solid ButtonBorder;
  width: 1.5em;
  height: auto;
  margin: 0.25em 0;
}
</style>

## Basic toolbar

<ClientOnly>
<div class="demo-section tb-demo">
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
<div class="demo-section tb-demo">
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
<div class="demo-section tb-demo">
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

## API

<ApiTable tag="rc-toolbar" />
