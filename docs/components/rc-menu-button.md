<script setup>
import { ref, onMounted } from 'vue';

const status = ref('Ready');

onMounted(() => {
  document.querySelectorAll('.mb-demo rc-menu-button').forEach((mb) => {
    mb.addEventListener('rc-menu-button-toggle', (e) => {
      status.value = e.detail.open ? 'Menu opened' : 'Menu closed';
    });
  });
  document.querySelectorAll('.mb-demo rc-menu').forEach((menu) => {
    menu.addEventListener('rc-menu-activate', (e) => {
      status.value = `Action: "${e.detail.item.textContent.trim()}"`;
    });
  });
});
</script>

# rc-menu-button

A button that opens an ARIA menu popup. Handles toggle, positioning, focus management, and keyboard navigation between the trigger and the menu items.

[WAI-ARIA Menu Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-menu-button
```

```sh [yarn]
yarn add @rcarls/rc-menu-button
```

:::

```js
import '@rcarls/rc-menu-button/define';
```

<style>
.mb-demo .menu-trigger {
  padding: 0.5em 1em;
  font-size: 1rem;
  cursor: pointer;
  font: inherit;
  border: 1px solid ButtonBorder;
  border-radius: 4px;
  background: ButtonFace;
  color: ButtonText;
}
.mb-demo rc-menu button {
  all: unset;
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: 0.5em 1em;
  cursor: pointer;
  font: inherit;
}
.mb-demo rc-menu button:hover { background: color-mix(in srgb, currentColor 10%, transparent); }
.mb-demo rc-menu button:focus-visible { outline: 2px solid Highlight; outline-offset: -2px; }
.mb-demo rc-menu button[disabled] { opacity: 0.5; cursor: not-allowed; }
</style>

## Basic menu button

<ClientOnly>
<div class="demo-section mb-demo">
  <rc-menu-button>
    <button slot="trigger" class="menu-trigger">Options</button>
    <rc-menu label="Options">
      <button onclick="void 0">Cut</button>
      <button onclick="void 0">Copy</button>
      <button onclick="void 0">Paste</button>
    </rc-menu>
  </rc-menu-button>
  <p style="margin:0.75rem 0 0;font-size:0.875rem;color:var(--vp-c-text-2);">{{ status }}</p>
</div>
</ClientOnly>

```html
<rc-menu-button>
  <button slot="trigger">Options</button>
  <rc-menu label="Options">
    <button>Cut</button>
    <button>Copy</button>
    <button>Paste</button>
  </rc-menu>
</rc-menu-button>
```

```js
menuButton.addEventListener('rc-menu-button-toggle', (e) => {
  console.log(e.detail.open); // true | false
});
```

## With disabled items

<ClientOnly>
<div class="demo-section mb-demo">
  <rc-menu-button>
    <button slot="trigger" class="menu-trigger">File</button>
    <rc-menu label="File Actions">
      <button onclick="void 0">New</button>
      <button onclick="void 0">Open</button>
      <button onclick="void 0" disabled>Save</button>
      <button onclick="void 0">Close</button>
    </rc-menu>
  </rc-menu-button>
</div>
</ClientOnly>

## Multiple menu buttons

Multiple independent menu buttons can coexist. Opening one closes any other open menus.

<ClientOnly>
<div class="demo-section mb-demo">
  <div style="display:flex;gap:0.5rem;">
    <rc-menu-button>
      <button slot="trigger" class="menu-trigger">Edit</button>
      <rc-menu label="Edit Actions">
        <button onclick="void 0">Undo</button>
        <button onclick="void 0">Redo</button>
      </rc-menu>
    </rc-menu-button>
    <rc-menu-button>
      <button slot="trigger" class="menu-trigger">View</button>
      <rc-menu label="View Options">
        <button onclick="void 0">Zoom In</button>
        <button onclick="void 0">Zoom Out</button>
        <button onclick="void 0">Reset Zoom</button>
      </rc-menu>
    </rc-menu-button>
  </div>
</div>
</ClientOnly>

## API

<ApiTable tag="rc-menu-button" />
