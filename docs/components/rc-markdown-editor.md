# rc-markdown-editor

A WYSIWYG Markdown editor built on `rc-textarea`. Includes a formatting toolbar with bold, italic, headings, lists, blockquotes, code blocks, and more.

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-markdown-editor
```

```sh [yarn]
yarn add @rcarls/rc-markdown-editor
```

:::

```js
import '@rcarls/rc-markdown-editor/define';
```

## Basic usage

```html
<rc-markdown-editor>
  <textarea name="content" rows="12" placeholder="Write some Markdown…"></textarea>
</rc-markdown-editor>
```

## With toolbar

The editor includes `rc-editor-toolbar` which is automatically wired up when placed adjacent to the editor.

```html
<div class="editor-wrapper">
  <rc-editor-toolbar for="my-editor"></rc-editor-toolbar>
  <rc-markdown-editor id="my-editor">
    <textarea name="content" rows="16"></textarea>
  </rc-markdown-editor>
</div>
```

## API

<ApiTable tag="rc-markdown-editor" />
