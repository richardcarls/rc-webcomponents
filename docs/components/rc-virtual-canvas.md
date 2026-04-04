# rc-virtual-canvas

A virtualized canvas component for rendering large datasets efficiently. Only renders items visible in the viewport.

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-virtual-canvas
```

```sh [yarn]
yarn add @rcarls/rc-virtual-canvas
```

:::

```js
import '@rcarls/rc-virtual-canvas/define';
```

## Basic usage

```js
import '@rcarls/rc-virtual-canvas/define';

const canvas = document.querySelector('rc-virtual-canvas');
canvas.items = Array.from({ length: 10000 }, (_, i) => ({ id: i, label: `Item ${i}` }));
canvas.renderItem = (item, el) => {
  el.textContent = item.label;
};
```

```html
<rc-virtual-canvas style="height: 400px;"></rc-virtual-canvas>
```

## API

<ApiTable tag="rc-virtual-canvas" />
