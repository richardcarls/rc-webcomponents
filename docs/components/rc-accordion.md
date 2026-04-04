# rc-accordion

An accordion coordinator for groups of `rc-disclosure` widgets. Manages exclusive-open behavior and keyboard navigation.

[WAI-ARIA Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-accordion
```

```sh [yarn]
yarn add @rcarls/rc-accordion
```

:::

```js
import '@rcarls/rc-accordion/define';
```

## Basic usage

```html
<rc-accordion>
  <rc-disclosure>
    <details>
      <summary>Section 1</summary>
      <p>Content for section 1.</p>
    </details>
  </rc-disclosure>
  <rc-disclosure>
    <details>
      <summary>Section 2</summary>
      <p>Content for section 2.</p>
    </details>
  </rc-disclosure>
  <rc-disclosure>
    <details>
      <summary>Section 3</summary>
      <p>Content for section 3.</p>
    </details>
  </rc-disclosure>
</rc-accordion>
```

## API

<ApiTable tag="rc-accordion" />
