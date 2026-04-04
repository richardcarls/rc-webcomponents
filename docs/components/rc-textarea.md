# rc-textarea

An enhanced textarea with line decorations, gutter rendering, and a plugin API. Wraps a native `<textarea>` and adds visual enhancements without breaking native form behavior.

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-textarea
```

```sh [yarn]
yarn add @rcarls/rc-textarea
```

:::

```js
import '@rcarls/rc-textarea/define';
```

## Basic usage

```html
<rc-textarea>
  <textarea name="notes" rows="8" placeholder="Type here…"></textarea>
</rc-textarea>
```

## With plugins

Plugins extend the textarea with syntax highlighting, decoration, and other capabilities.

```js
import { markdownPlugin } from '@rcarls/rc-textarea-plugin-markdown';

const editor = document.querySelector('rc-textarea');
editor.addPlugin(markdownPlugin());
```

## API

<ApiTable tag="rc-textarea" />
