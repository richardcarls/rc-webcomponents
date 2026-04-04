# rc-splitter

A resizable pane splitter. Drag the separator or use arrow keys to resize adjacent panes.

[WAI-ARIA Window Splitter Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/)

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-splitter
```

```sh [yarn]
yarn add @rcarls/rc-splitter
```

:::

```js
import '@rcarls/rc-splitter/define';
```

## Basic usage

```html
<rc-splitter style="display: flex; height: 400px;">
  <div slot="primary" style="overflow: auto; padding: 1rem;">
    Primary panel content
  </div>
  <div slot="secondary" style="overflow: auto; padding: 1rem;">
    Secondary panel content
  </div>
</rc-splitter>
```

## API

<ApiTable tag="rc-splitter" />
