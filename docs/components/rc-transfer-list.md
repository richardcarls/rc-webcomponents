# rc-transfer-list

An ARIA dual-listbox transfer list. Users move items between two panels using buttons or keyboard shortcuts.

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

## Basic usage

```html
<rc-transfer-list>
  <rc-listbox slot="available" label="Available">
    <ul role="listbox" aria-label="Available items">
      <li role="option" data-value="a">Item A</li>
      <li role="option" data-value="b">Item B</li>
    </ul>
  </rc-listbox>
  <rc-listbox slot="selected" label="Selected">
    <ul role="listbox" aria-label="Selected items">
    </ul>
  </rc-listbox>
</rc-transfer-list>
```

## API

<ApiTable tag="rc-transfer-list" />
