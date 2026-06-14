<script setup>
import { ref, onMounted } from 'vue';

const lastAction = ref('');

onMounted(() => {
  document.querySelectorAll('rc-menu').forEach((menu) => {
    menu.addEventListener('rc-menu-activate', (e) => {
      lastAction.value = e.detail.item.textContent.trim();
    });
  });
});
</script>

# rc-menu

An ARIA menu popup with full keyboard navigation. Arrow keys move between items; disabled items are skipped. Used standalone or as the popup for `rc-menu-button`.

[WAI-ARIA Menu Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu/)

<AtAGlance
  package-name="@rcarls/rc-menu"
  tag="rc-menu"
  native="Uses consumer-provided menuitem elements"
  state="Active item managed by keyboard navigation"
  :events="['rc-menu-activate', 'rc-menu-close']"
  :related="[
    { label: 'rc-menu-button', href: '/components/rc-menu-button' },
    { label: 'rc-menubar', href: '/components/rc-menubar' }
  ]"
/>

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-menu
```

```sh [yarn]
yarn add @rcarls/rc-menu
```

:::

```js
import '@rcarls/rc-menu/define';
```

## Basic menu

<ClientOnly>
<div class="demo-section">
  <rc-menu label="Actions">
    <button onclick="void 0">Cut</button>
    <button onclick="void 0">Copy</button>
    <button onclick="void 0">Paste</button>
  </rc-menu>
  <p v-if="lastAction" style="margin:0.5rem 0 0;font-size:0.875rem;color:var(--vp-c-text-2);">
    Activated: {{ lastAction }}
  </p>
</div>
</ClientOnly>

```html
<rc-menu label="Actions">
  <button>Cut</button>
  <button>Copy</button>
  <button>Paste</button>
</rc-menu>
```

```js
menu.addEventListener('rc-menu-activate', (e) => {
  console.log(e.detail.item.textContent.trim());
});
```

## With disabled items

Disabled items are visible but skipped by keyboard navigation.

<ClientOnly>
<div class="demo-section">
  <rc-menu label="File Actions">
    <button onclick="void 0">New</button>
    <button onclick="void 0">Open</button>
    <button onclick="void 0" disabled>Save</button>
    <button onclick="void 0">Close</button>
  </rc-menu>
</div>
</ClientOnly>

```html
<rc-menu label="File">
  <button>New</button>
  <button>Open</button>
  <button disabled>Save</button>
  <button>Close</button>
</rc-menu>
```

## Icon + text items

`all: unset` resets `display` to `inline`, breaking SVG layout. Add `display: flex; align-items: center` after the reset to restore it.

<ClientOnly>
<div class="demo-section">
  <rc-menu label="Edit Actions">
    <button class="has-icon" onclick="void 0">
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
      </svg>
      Undo
    </button>
    <button class="has-icon" onclick="void 0">
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
      </svg>
      Copy
    </button>
    <button class="has-icon" onclick="void 0" disabled>
      <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M5 1.5A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5v1A1.5 1.5 0 0 1 9.5 4h-3A1.5 1.5 0 0 1 5 2.5v-1zm1.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-3zM3 4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H9v1h4a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4V4H3z"/>
      </svg>
      Paste
    </button>
  </rc-menu>
</div>
</ClientOnly>

```css
rc-menu button.has-icon {
  display: flex;
  align-items: center;
  gap: 0.6em;
}
```

## Material bridge

`@rcarls/rc-theme-material` maps Material menu surface, item, separator, and
elevation tokens into this component without styling slotted native buttons.
See [Theme previews](/guide/theme-previews) for integration details.

## API

<ApiTable tag="rc-menu" />
