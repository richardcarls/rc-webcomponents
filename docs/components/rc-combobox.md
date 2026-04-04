# rc-combobox

An editable combobox with filtering and allow-create, backed by a native `<select>`. Supports single and multi-select with chip display.

[WAI-ARIA Combobox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-combobox
```

```sh [yarn]
yarn add @rcarls/rc-combobox
```

:::

```js
import '@rcarls/rc-combobox/define';
```

## Basic usage

```html
<rc-combobox placeholder="Search…">
  <select slot="select" name="fruit">
    <option value="apple">Apple</option>
    <option value="banana">Banana</option>
    <option value="cherry">Cherry</option>
  </select>
</rc-combobox>
```

## API

<ApiTable tag="rc-combobox" />
