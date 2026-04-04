# rc-menu-button

A button that opens an ARIA menu popup. Handles toggle, focus management, and keyboard navigation.

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

## Basic usage

```html
<rc-menu-button>
  <button slot="button">Actions ▾</button>
  <rc-menu slot="menu">
    <ul role="menu">
      <li role="menuitem">Edit</li>
      <li role="menuitem">Duplicate</li>
      <li role="menuitem">Delete</li>
    </ul>
  </rc-menu>
</rc-menu-button>
```

## API

<ApiTable tag="rc-menu-button" />
