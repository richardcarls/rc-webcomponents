# rc-menubar

An ARIA menubar with roving tabindex for horizontal navigation between top-level items.

[WAI-ARIA Menubar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)

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

## Basic usage

```html
<rc-menubar>
  <ul role="menubar">
    <li role="none">
      <rc-menu-button>
        <button slot="button" role="menuitem">File</button>
        <rc-menu slot="menu">
          <ul role="menu">
            <li role="menuitem">New</li>
            <li role="menuitem">Open</li>
            <li role="menuitem">Save</li>
          </ul>
        </rc-menu>
      </rc-menu-button>
    </li>
    <li role="none">
      <rc-menu-button>
        <button slot="button" role="menuitem">Edit</button>
        <rc-menu slot="menu">
          <ul role="menu">
            <li role="menuitem">Cut</li>
            <li role="menuitem">Copy</li>
            <li role="menuitem">Paste</li>
          </ul>
        </rc-menu>
      </rc-menu-button>
    </li>
  </ul>
</rc-menubar>
```

## API

<ApiTable tag="rc-menubar" />
