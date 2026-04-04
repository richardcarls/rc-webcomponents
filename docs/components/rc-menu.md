# rc-menu

An ARIA menu popup with full keyboard navigation. Used standalone or via `rc-menu-button`.

[WAI-ARIA Menu Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu/)

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

## Basic usage

```html
<rc-menu>
  <ul role="menu">
    <li role="menuitem">Cut</li>
    <li role="menuitem">Copy</li>
    <li role="menuitem">Paste</li>
    <li role="separator"></li>
    <li role="menuitem">Select All</li>
  </ul>
</rc-menu>
```

## API

<ApiTable tag="rc-menu" />
