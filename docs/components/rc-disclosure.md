# rc-disclosure

A disclosure widget wrapping native `<details>`/`<summary>`. Adds animated expand/collapse and controlled open state.

[WAI-ARIA Disclosure Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-disclosure
```

```sh [yarn]
yarn add @rcarls/rc-disclosure
```

:::

```js
import '@rcarls/rc-disclosure/define';
```

## Basic usage

```html
<rc-disclosure>
  <details>
    <summary>What is a disclosure widget?</summary>
    <p>
      A disclosure widget shows or hides a section of content. This one is
      built on the native &lt;details&gt; element for progressive enhancement.
    </p>
  </details>
</rc-disclosure>
```

## API

<ApiTable tag="rc-disclosure" />
