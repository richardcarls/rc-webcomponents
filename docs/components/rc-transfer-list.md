# rc-transfer-list

An ARIA transfer list backed by a native `<select multiple>`. Users move items between Available and Selected panels using buttons or keyboard shortcuts. Selected options reflect back to the `<select>` for form participation.

<AtAGlance
  package-name="@rcarls/rc-transfer-list"
  tag="rc-transfer-list"
  native="Requires a native select[multiple] child"
  state="Controlled or uncontrolled selected items"
  :events="['rc-transfer-list-change']"
  :related="[
    { label: 'Progressive enhancement', href: '/guide/progressive-enhancement' },
    { label: 'rc-select', href: '/components/rc-select' }
  ]"
/>

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

## Basic

Backed by a native `<select multiple>`. Transfers reflect back to the `<select>` for form participation — no JavaScript required.

<ClientOnly>
<div class="demo-section">
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
<div class="demo-section">
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
