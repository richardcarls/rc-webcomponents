# rc-transfer-list

An ARIA transfer list backed by a native `<select multiple>`. Users move items between Available and Selected panels using buttons or keyboard shortcuts. Selected options reflect back to the `<select>` for form participation.

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-transfer-list
```

```sh [yarn]
yarn add @rcarls/rc-transfer-list
```

:::

```js
import '@rcarls/rc-transfer-list/define';
```

<style>
.tl-demo rc-transfer-list { display: inline-block; }
.tl-demo .rc-transfer-list-root {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0.75em;
  align-items: start;
}
.tl-demo .rc-transfer-list-panel { display: flex; flex-direction: column; gap: 0.25em; }
.tl-demo .rc-transfer-list-panel [part~="label"] {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.tl-demo rc-transfer-list rc-listbox {
  min-width: 160px;
  height: 200px;
  border: 1px solid ButtonBorder;
  border-radius: 4px;
  overflow-y: auto;
  display: block;
}
.tl-demo .rc-transfer-list-actions { padding-block-start: 1.5em; }
.tl-demo rc-transfer-list button {
  padding: 0.35em 0.75em;
  font-size: 0.875rem;
  border: 1px solid ButtonBorder;
  border-radius: 4px;
  background: ButtonFace;
  color: ButtonText;
  cursor: pointer;
  white-space: nowrap;
  font: inherit;
}
.tl-demo rc-transfer-list button:hover:not(:disabled) {
  background: color-mix(in srgb, ButtonFace 80%, Highlight 20%);
}
.tl-demo rc-transfer-list button:disabled { opacity: 0.45; cursor: not-allowed; }
.tl-demo rc-listbox [part~="option"] { padding: 0.3em 0.6em; cursor: default; user-select: none; }
.tl-demo rc-listbox [part~="option"][aria-selected="true"] { background: Highlight; color: HighlightText; }
.tl-demo rc-listbox [part~="option"][data-active] { outline: 2px solid Highlight; outline-offset: -2px; }
</style>

## Basic

Backed by a native `<select multiple>`. Transfers reflect back to the `<select>` for form participation — no JavaScript required.

<ClientOnly>
<div class="demo-section tl-demo">
  <rc-transfer-list available-label="Available" selected-label="Selected">
    <select multiple name="features">
      <option value="dark-mode">Dark mode</option>
      <option value="notifications">Notifications</option>
      <option value="auto-save">Auto-save</option>
      <option value="spell-check">Spell check</option>
      <option value="word-wrap">Word wrap</option>
      <option value="line-numbers">Line numbers</option>
      <option value="minimap">Minimap</option>
      <option value="breadcrumbs">Breadcrumbs</option>
    </select>
  </rc-transfer-list>
</div>
</ClientOnly>

```html
<rc-transfer-list available-label="Available" selected-label="Selected">
  <select multiple name="features">
    <option value="dark-mode">Dark mode</option>
    <option value="notifications">Notifications</option>
    <!-- ... -->
  </select>
</rc-transfer-list>
```

## Multi-selection

`multiple` allows selecting several items before transferring them all at once. Click or use Ctrl/Shift+Click for multi-select within each panel.

<ClientOnly>
<div class="demo-section tl-demo">
  <rc-transfer-list multiple available-label="Team members" selected-label="Assigned">
    <select multiple name="team">
      <option value="alice">Alice</option>
      <option value="bob">Bob</option>
      <option value="carol">Carol</option>
      <option value="dave">Dave</option>
      <option value="eve">Eve</option>
    </select>
  </rc-transfer-list>
</div>
</ClientOnly>

```html
<rc-transfer-list multiple available-label="Team members" selected-label="Assigned">
  <select multiple name="team">
    <option value="alice">Alice</option>
    <!-- ... -->
  </select>
</rc-transfer-list>
```

```js
list.addEventListener('rc-transfer-list-change', (e) => {
  console.log(e.detail); // { selected: ['alice', 'bob'] }
});
```

## API

<ApiTable tag="rc-transfer-list" />
