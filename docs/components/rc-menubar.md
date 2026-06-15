<script setup>
import { ref, onMounted } from 'vue';

const status = ref('Ready');

onMounted(() => {
  document.querySelectorAll('.mbar-demo rc-menu').forEach((menu) => {
    menu.addEventListener('rc-menu-activate', (e) => {
      status.value = `"${e.detail.item.textContent.trim()}" triggered`;
    });
  });
});
</script>

# rc-menubar

An ARIA menubar with roving tabindex for horizontal navigation between top-level menu buttons. Arrow keys move between menus; opening a menu with the keyboard automatically opens adjacent menus as focus moves.

[WAI-ARIA Menubar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)

<AtAGlance
  package-name="@rcarls/rc-menubar"
  tag="rc-menubar"
  native="Uses consumer-provided menu buttons and menu items"
  state="Active item managed by roving tabindex"
  :events="[]"
  :related="[
    { label: 'rc-menu', href: '/components/rc-menu' },
    { label: 'rc-menu-button', href: '/components/rc-menu-button' }
  ]"
/>

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-menubar
```

```sh [yarn]
yarn add @rcarls/rc-menubar
```

:::

```js
import '@rcarls/rc-menubar/define';
```

## Application menubar

<ClientOnly>
<div class="demo-section">
  <rc-menubar label="Application Menu">
    <rc-menu-button>
      <button slot="trigger">File</button>
      <rc-menu label="File">
        <button onclick="void 0">New</button>
        <button onclick="void 0">Open…</button>
        <button onclick="void 0" disabled>Save</button>
        <button onclick="void 0">Close</button>
      </rc-menu>
    </rc-menu-button>
    <rc-menu-button>
      <button slot="trigger">Edit</button>
      <rc-menu label="Edit">
        <button onclick="void 0">Undo</button>
        <button onclick="void 0">Redo</button>
        <button onclick="void 0">Cut</button>
        <button onclick="void 0">Copy</button>
        <button onclick="void 0">Paste</button>
      </rc-menu>
    </rc-menu-button>
    <rc-menu-button>
      <button slot="trigger">View</button>
      <rc-menu label="View">
        <button onclick="void 0">Zoom In</button>
        <button onclick="void 0">Zoom Out</button>
        <button onclick="void 0">Reset Zoom</button>
      </rc-menu>
    </rc-menu-button>
    <rc-menu-button>
      <button slot="trigger">Help</button>
      <rc-menu label="Help">
        <button onclick="void 0">Documentation</button>
        <button onclick="void 0">About</button>
      </rc-menu>
    </rc-menu-button>
  </rc-menubar>
  <p style="margin:0.75rem 0 0;font-size:0.875rem;color:var(--vp-c-text-2);">{{ status }}</p>
</div>
</ClientOnly>

```html
<rc-menubar label="Application Menu">
  <rc-menu-button>
    <button slot="trigger">File</button>
    <rc-menu label="File">
      <button>New</button>
      <button>Open…</button>
      <button disabled>Save</button>
    </rc-menu>
  </rc-menu-button>
  <rc-menu-button>
    <button slot="trigger">Edit</button>
    <rc-menu label="Edit">
      <button>Undo</button>
      <button>Redo</button>
    </rc-menu>
  </rc-menu-button>
</rc-menubar>
```

## Vertical menubar

<ClientOnly>
<div class="demo-section">
  <rc-menubar label="Vertical Menu" orientation="vertical" style="display:inline-flex;">
    <rc-menu-button>
      <button slot="trigger">Options</button>
      <rc-menu label="Options">
        <button onclick="void 0">Option 1</button>
        <button onclick="void 0">Option 2</button>
      </rc-menu>
    </rc-menu-button>
    <rc-menu-button>
      <button slot="trigger">Settings</button>
      <rc-menu label="Settings">
        <button onclick="void 0">Preferences</button>
        <button onclick="void 0">Account</button>
      </rc-menu>
    </rc-menu-button>
  </rc-menubar>
</div>
</ClientOnly>

```html
<rc-menubar orientation="vertical" label="Sidebar">
  <rc-menu-button>
    <button slot="trigger">Options</button>
    <rc-menu label="Options"><!-- ... --></rc-menu>
  </rc-menu-button>
</rc-menubar>
```

## Document editor menubar

A realistic editor structure with Format, Insert, and View menus.

<ClientOnly>
<div class="demo-section">
  <rc-menubar label="Document Editor">
    <rc-menu-button>
      <button slot="trigger">Format</button>
      <rc-menu label="Format">
        <button onclick="void 0">Bold</button>
        <button onclick="void 0">Italic</button>
        <button onclick="void 0">Underline</button>
        <button onclick="void 0" disabled>Strikethrough</button>
        <button onclick="void 0">Inline code</button>
      </rc-menu>
    </rc-menu-button>
    <rc-menu-button>
      <button slot="trigger">Insert</button>
      <rc-menu label="Insert">
        <button onclick="void 0">Image…</button>
        <button onclick="void 0">Link…</button>
        <button onclick="void 0">Table</button>
        <button onclick="void 0">Horizontal rule</button>
      </rc-menu>
    </rc-menu-button>
    <rc-menu-button>
      <button slot="trigger">View</button>
      <rc-menu label="View">
        <button onclick="void 0">Outline</button>
        <button onclick="void 0">Word count</button>
        <button onclick="void 0">Focus mode</button>
        <button onclick="void 0">Full screen</button>
      </rc-menu>
    </rc-menu-button>
  </rc-menubar>
</div>
</ClientOnly>

## Material bridge

`@rcarls/rc-theme-material` maps Material surface, shape, spacing, and menu
tokens into this component. Consumer-provided native buttons retain their own
appearance. See [Theme previews](/guide/theme-previews).

## API

<ApiTable tag="rc-menubar" />
