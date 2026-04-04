# rc-toolbar

An ARIA toolbar with roving tabindex. Groups related controls and provides keyboard navigation with Arrow keys.

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

## Basic usage

```html
<rc-toolbar>
  <div role="toolbar" aria-label="Text formatting">
    <button aria-pressed="false">Bold</button>
    <button aria-pressed="false">Italic</button>
    <button aria-pressed="false">Underline</button>
    <hr role="separator">
    <button>Align left</button>
    <button>Align center</button>
    <button>Align right</button>
  </div>
</rc-toolbar>
```

## API

<ApiTable tag="rc-toolbar" />
