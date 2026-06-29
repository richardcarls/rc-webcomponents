# rc-textarea

Textarea wrapper with line decorations, gutter rendering, inline widgets, and plugin hooks.

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-textarea](https://richardcarls.github.io/rc-webcomponents/components/rc-textarea).

Made with [Lit](https://lit.dev) and [Parchment](https://github.com/quilljs/parchment).

---

## Feature Highlights

- **Mixed inline formatting** - bold, italic, color, background, and underline
- **Imperative APIs** that behave well with reactive frameworks
- **Error-lens style line annotations** that stay separate from text content
- **Inline widgets** - color swatches, icons, tooltips or quick action buttons are possible
- **Simple Pattern API** that auto-decorates text matching regular expressions
- **Plugin API** - imperative decoration control + highlight.js / prism.js HTML compatibility bridge
- **Line numbers, word wrap, auto-grow** - declarative features for common use cases
- **Progressive enhancement** - wraps a native `<textarea>` for form submission, label association
- **Undo/redo** - durable internally-tracked undo stack

---

## Installation

```bash
npm install @rcarls/rc-textarea
```

```bash
yarn add @rcarls/rc-textarea
```

Import the define entry to register `<rc-textarea>`:

```ts
import '@rcarls/rc-textarea/define';
```

Import public types when you need typed access:

```ts
import type { RCTextarea, RCTextareaPlugin } from '@rcarls/rc-textarea';
```

## Basic Usage

Slot a native `<textarea>` as the direct child. It is hidden from view and used
only for form wiring.

```html
<label for="message">Message</label>

<rc-textarea line-numbers word-wrap auto-grow>
  <textarea id="message" name="message" rows="10" placeholder="Start typing..."></textarea>
</rc-textarea>
```

Use the `value` property for controlled updates, `defaultValue` for an initial uncontrolled
value, and `rc-textarea-change` for user-originated changes.

```ts
const editor = document.querySelector('rc-textarea');

editor.value = 'Programmatic updates are silent.';

editor.addEventListener('rc-textarea-change', (event) => {
  console.log(event.detail.value);
});
```

When the user edits, the slotted textarea is kept in sync and dispatches a native bubbling
`input` event. Submitting a form reads the textarea's plain-text value normally.

```html
<form>
  <rc-textarea>
    <textarea name="body" required maxlength="5000"></textarea>
  </rc-textarea>

  <button type="submit">Send</button>
</form>
```

## Common Options

| Attribute      | Property      | Description                                                                         |
| -------------- | ------------- | ----------------------------------------------------------------------------------- |
| `line-numbers` | `lineNumbers` | Show sequential line numbers in the gutter.                                         |
| `gutter`       | `gutter`      | Show an empty gutter that plugins can populate with `LineDecoration.gutterContent`. |
| `word-wrap`    | `wordWrap`    | Wrap long lines instead of scrolling horizontally.                                  |
| `auto-grow`    | `autoGrow`    | Let the field grow vertically with content.                                         |
| `read-only`    | `readOnly`    | Render selectable, non-editable content.                                            |

`list-numbers` and `label` still exist for compatibility but are deprecated. Prefer a plugin
with `LineDecoration.gutterContent` for sparse numbering, and put accessible names on the
slotted textarea with `aria-label` or a real `<label for="...">`.

The main JavaScript-only properties are:

| Property                          | Type                       | Description                                                               |
| --------------------------------- | -------------------------- | ------------------------------------------------------------------------- |
| `value`                           | `string`                   | Current plain-text value. Host writes are silent.                         |
| `defaultValue`                    | `string \| undefined`      | Initial uncontrolled value, used before `value` or textarea content wins. |
| `plugin`                          | `RCTextareaPlugin \| null` | Declarative plugin hook for reactive frameworks.                          |
| `decorations`                     | `DecorationInput[]`        | External decoration layer merged with plugin and pattern decorations.     |
| `selectionStart` / `selectionEnd` | `number`                   | Current plain-text selection offsets.                                     |

## Events

All public events bubble and are composed.

| Event                | Detail                                             | Fires when                                         |
| -------------------- | -------------------------------------------------- | -------------------------------------------------- |
| `rc-textarea-change` | `{ value: string }`                                | User editing changes the plain-text value.         |
| `rc-textarea-focus`  | none                                               | The editor receives focus.                         |
| `rc-textarea-blur`   | none                                               | The editor loses focus.                            |
| `rc-textarea-select` | `{ selectionStart: number, selectionEnd: number }` | The selection changes while the editor is focused. |

## Pattern Highlights

Use `addPattern()` for lightweight regex decoration without writing a plugin.

```ts
const todoPatternId = editor.addPattern({
  pattern: /\bTODO\b/g,
  bold: true,
  color: 'var(--editor-todo-color)',
});

editor.removePattern(todoPatternId);
editor.clearPatterns();
```

Patterns can also style named capture groups and add line diagnostics.

```ts
editor.addPattern({
  pattern: /^(?<key>\w[\w-]*):\s*(?<value>.+)$/gm,
  captureGroups: {
    key: { bold: true, color: 'var(--editor-key-color)' },
    value: { color: 'var(--editor-value-color)' },
  },
  createLineDecoration: () => ({ className: 'config-line' }),
});
```

See [PLUGIN_AUTHORING.md](PLUGIN_AUTHORING.md) for the complete decoration and plugin model.

## Markdown Plugin Package

Install the Markdown plugin package when you want Markdown-oriented decorations and preview
HTML without writing your own parser bridge.

```bash
npm install @rcarls/rc-textarea @rcarls/rc-textarea-plugin-markdown \
  mdast-util-from-markdown micromark unist-util-visit
```

```bash
yarn add @rcarls/rc-textarea @rcarls/rc-textarea-plugin-markdown \
  mdast-util-from-markdown micromark unist-util-visit
```

```ts
import '@rcarls/rc-textarea/define';
import { createMarkdownPlugin } from '@rcarls/rc-textarea-plugin-markdown';

const editor = document.querySelector('rc-textarea');
const markdown = createMarkdownPlugin();

editor.usePlugin(markdown);

preview.innerHTML = markdown.getPreviewHtml(editor.value);
```

The package decorates common Markdown syntax using `mdast-util-from-markdown` and exposes
`getMarkdownPreviewHtml()` / `plugin.getPreviewHtml()` for preview rendering.

## highlight.js And Prism Bridge

`rc-textarea` can consume the HTML strings produced by highlighters that wrap token text in
`<span class="...">...</span>` nodes. Return that HTML from `highlight()` or call
`api.parseDecorationsFromHtml()` yourself inside `update()`.

```ts
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';

hljs.registerLanguage('javascript', javascript);

editor.usePlugin({
  mount(api) {
    api.adoptStyleSheet(`
      .hljs-keyword { color: var(--editor-syntax-keyword); font-weight: 600; }
      .hljs-string { color: var(--editor-syntax-string); }
      .hljs-comment { color: var(--editor-syntax-comment); font-style: italic; }
    `);
  },

  highlight(value) {
    return hljs.highlight(value, { language: 'javascript' }).value;
  },
});
```

```ts
import Prism from 'prismjs';
import 'prismjs/components/prism-python';

editor.usePlugin({
  mount(api) {
    api.adoptStyleSheet(`
      .token.keyword { color: var(--editor-syntax-keyword); font-weight: 600; }
      .token.string { color: var(--editor-syntax-string); }
      .token.comment { color: var(--editor-syntax-comment); font-style: italic; }
    `);
  },

  highlight(value) {
    return Prism.highlight(value, Prism.languages.python, 'python');
  },
});
```

For Lezer, Unified, and Shiki integrations, see `@rcarls/rc-textarea-adapters`.

## Theming

`rc-textarea` is design-system neutral and uses CSS system colors by default. Theme it with broad tokens
for the field, then add component tokens for editor-specific surfaces.

### Broad Theme Tokens

The component reads inherited tokens where possible:

| Token          | Use                                                          |
| -------------- | ------------------------------------------------------------ |
| `--rc-text`    | Fallback text color before `--rc-textarea-color`.            |
| `color-scheme` | Inherited by the host so system colors match the page theme. |

### Component Tokens

| Token                                     | Default                               | Use                                   |
| ----------------------------------------- | ------------------------------------- | ------------------------------------- |
| `--rc-textarea-font-family`               | `monospace`                           | Editor and gutter font family.        |
| `--rc-textarea-font-size`                 | `1em`                                 | Editor and gutter font size.          |
| `--rc-textarea-line-height`               | `1.5`                                 | Editor and gutter line height.        |
| `--rc-textarea-padding`                   | `0.5em`                               | Editor and gutter padding.            |
| `--rc-textarea-background`                | `Field`                               | Field background.                     |
| `--rc-textarea-color`                     | `var(--rc-text, FieldText)`           | Field text color.                     |
| `--rc-textarea-caret-color`               | `var(--rc-textarea-color, FieldText)` | Caret color.                          |
| `--rc-textarea-border`                    | `1px solid ButtonBorder`              | Field border.                         |
| `--rc-textarea-border-radius`             | `2px`                                 | Field corner radius.                  |
| `--rc-textarea-focus-outline`             | `2px solid Highlight`                 | Focus ring.                           |
| `--rc-textarea-active-line-bg`            | `transparent`                         | Active line background.               |
| `--rc-textarea-gutter-bg`                 | `Canvas`                              | Gutter background.                    |
| `--rc-textarea-gutter-color`              | `GrayText`                            | Gutter text color.                    |
| `--rc-textarea-gutter-border`             | `1px solid ButtonBorder`              | Gutter separator.                     |
| `--rc-textarea-gutter-padding-inline-end` | `0.75em`                              | Space between gutter labels and text. |

```css
rc-textarea {
  color-scheme: dark;
  --rc-textarea-font-family: 'Fira Code', monospace;
  --rc-textarea-font-size: 13px;
  --rc-textarea-background: #1e1e2e;
  --rc-textarea-color: #cdd6f4;
  --rc-textarea-border: 1px solid #313244;
  --rc-textarea-active-line-bg: rgb(255 255 255 / 0.06);
}
```

### Parts And Decoration Styles

The exposed CSS parts are `root`, `gutter`, `gutter-cells`, `editor-area`, and `editor`.

```css
rc-textarea::part(editor) {
  tab-size: 2;
}
```

Decoration elements are inside the shadow root. Use `api.adoptStyleSheet()` from a plugin to
style custom classes such as `.my-highlight`, `.line[data-message]`, or token classes from a
syntax highlighter.

## Keyboard Behavior

| Key                               | Behavior                                                     |
| --------------------------------- | ------------------------------------------------------------ |
| `Tab`                             | Inserts `\t`.                                                |
| `Ctrl/Cmd+Z`                      | Undo.                                                        |
| `Ctrl/Cmd+Y` / `Ctrl/Cmd+Shift+Z` | Redo.                                                        |
| `Paste`                           | Inserts plain text only and normalizes line endings to `\n`. |
| `Enter`                           | Inserts a line break.                                        |

## More Detail

- [PLUGIN_AUTHORING.md](PLUGIN_AUTHORING.md) covers custom plugins, decoration types,
  selection APIs, stylesheet injection, and parser/highlighter recipes.
- [ARCHITECTURE.md](ARCHITECTURE.md) is an internal contributor reference for the rendering
  loop, Parchment integration, selection mapping, and gutter synchronization.

## License

[MIT](../../LICENSE)
