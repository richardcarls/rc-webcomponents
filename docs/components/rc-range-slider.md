# rc-range-slider

A two-thumb range slider for selecting a value range. Wraps two native `<input type="range">` elements.

[WAI-ARIA Slider Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/slider/)

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-range-slider
```

```sh [yarn]
yarn add @rcarls/rc-range-slider
```

:::

```js
import '@rcarls/rc-range-slider/define';
```

## Basic usage

```html
<rc-range-slider>
  <input slot="min" type="range" name="price-min" min="0" max="1000" value="100">
  <input slot="max" type="range" name="price-max" min="0" max="1000" value="800">
</rc-range-slider>
```

## API

<ApiTable tag="rc-range-slider" />
