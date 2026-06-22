# rc-textarea Plugin Authoring

This guide is for authors building `rc-textarea` plugins, syntax bridges, linters, toolbars,
or parser-backed decoration layers. For normal consumer usage, see [README.md](README.md).
For the internal rendering architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Mental Model

`rc-textarea` stores one plain-text value. Plugins add visual decorations over that value:

- Mark decorations style character ranges.
- Line decorations add classes, attributes, gutter content, or diagnostic messages to logical
  lines.
- Widget decorations insert non-editable inline DOM elements at character offsets.

Decorations never change the submitted textarea value. Offsets are always absolute character
indices into the current plain-text value unless a helper explicitly says otherwise.

Only one plugin is active at a time. Calling `usePlugin()` or assigning the `plugin` property
replaces the previous plugin and calls its `destroy()` hook.

## Quick Start

```ts
import type { RCTextareaPlugin, RCTextareaPluginAPI } from '@rcarls/rc-textarea';

const editor = document.querySelector('rc-textarea');

let api: RCTextareaPluginAPI | undefined;

const plugin: RCTextareaPlugin = {
  mount(pluginApi) {
    api = pluginApi;
  },

  update(value, pluginApi) {
    pluginApi.setDecorations(parseDiagnostics(value));
  },

  destroy() {
    api = undefined;
  },
};

editor.usePlugin(plugin);
```

Use `mount()` to capture the live API object, `update()` or `highlight()` to provide
decorations, and `destroy()` to remove external subscriptions.

## Plugin Interface

```ts
interface RCTextareaPlugin {
  mount?(api: RCTextareaPluginAPI): void;

  destroy?(): void;

  transform?(value: string, api: RCTextareaPluginAPI): string | null | void;

  update?(value: string, api: RCTextareaPluginAPI): void | Promise<void>;

  highlight?(
    value: string,
    api: RCTextareaPluginAPI,
  ): string | null | void | Promise<string | null | void>;
}
```

`transform()` runs only in read-only mode and substitutes the display-layer text without
changing `editor.value` or the slotted textarea value.

`update()` is the general-purpose hook. Use it when you already have decoration objects from a
parser, linter, or tokenizer.

`highlight()` is the compatibility hook for highlighters that return HTML. Return an HTML
string containing token spans; the component parses the string with
`api.parseDecorationsFromHtml()` and adds mark decorations.

Async `update()` and `highlight()` hooks are allowed. If a newer render starts while an async
hook is pending, stale results are discarded.

## Plugin API

```ts
interface RCTextareaPluginAPI {
  readonly host: HTMLElement;
  readonly value: string;
  readonly selectionStart: number;
  readonly selectionEnd: number;

  getCursorRect(): DOMRect | null;
  getWordAtCursor(): { word: string; from: number; to: number } | null;
  onCursorMove(callback: (selectionStart: number, selectionEnd: number) => void): () => void;

  addDecoration(decoration: DecorationInput): string;
  removeDecoration(id: string): void;
  clearDecorations(): void;
  setDecorations(decorations: DecorationInput[]): void;
  getDecorations(): readonly Decoration[];

  scheduleUpdate(): void;

  adoptStyleSheet(sheetOrCssText: CSSStyleSheet | string): CSSStyleSheet;
  removeStyleSheet(sheet: CSSStyleSheet): void;

  parseDecorationsFromHtml(html: string): Omit<MarkDecoration, 'id'>[];
  decorationsFromHtml(html: string): Omit<MarkDecoration, 'id'>[];
  decorationsFromTokens(
    tokens: Token[],
    themeMap: Record<string, Omit<MarkDecoration, 'id' | 'type' | 'from' | 'to'>>,
  ): Omit<MarkDecoration, 'id'>[];

  insertText(text: string): void;
  wrapSelection(prefix: string, suffix: string): void;
  replaceSelection(text: string): void;
}
```

`decorationsFromHtml()` is deprecated. Use `parseDecorationsFromHtml()` for new code.

### Text Mutation

`insertText()`, `wrapSelection()`, and `replaceSelection()` operate on the current saved
selection. They update the plain-text value, sync the slotted textarea, dispatch
`rc-textarea-change`, and schedule a render pass.

````ts
api.insertText('```\n\n```');
api.wrapSelection('**', '**');
api.replaceSelection('[replacement]');
````

`wrapSelection()` is a no-op when the selection is collapsed.

### External Updates

Call `scheduleUpdate()` when external state changes but the text value does not.

```ts
let removeThemeListener: (() => void) | undefined;

editor.usePlugin({
  mount(api) {
    const onThemeChange = () => api.scheduleUpdate();

    window.addEventListener('theme-change', onThemeChange);
    removeThemeListener = () => window.removeEventListener('theme-change', onThemeChange);
  },

  update(value, api) {
    api.setDecorations(decorate(value, currentTheme));
  },

  destroy() {
    removeThemeListener?.();
  },
});
```

## Decoration Types

When passing decorations to the API, omit `id`; the component assigns IDs.

```ts
type DecorationInput =
  | Omit<MarkDecoration, 'id'>
  | Omit<LineDecoration, 'id'>
  | Omit<WidgetDecoration, 'id'>;
```

### MarkDecoration

```ts
interface MarkDecoration {
  id: string;
  type: 'mark';
  from: number;
  to: number;
  className?: string;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  background?: string;
  underline?: 'solid' | 'wavy' | 'dotted' | 'dashed';
  underlineColor?: string;
  attributes?: Record<string, string>;
}
```

Mark decorations style the character range `[from, to)`.

```ts
api.setDecorations([
  {
    type: 'mark',
    from: 0,
    to: 5,
    className: 'keyword',
    bold: true,
  },
]);
```

### LineDecoration

```ts
interface LineDecoration {
  id: string;
  type: 'line';
  line: number;
  className?: string;
  message?: string;
  messageClassName?: string;
  attributes?: Record<string, string>;
  gutterContent?: string | null;
}
```

Line numbers are 1-based. `message` renders at the end of the line through
`.line[data-message]::after`, so it is visual and not part of the editable text or clipboard.

```ts
api.setDecorations([
  {
    type: 'line',
    line: 3,
    className: 'line-error',
    message: 'Missing semicolon',
    messageClassName: 'error',
    gutterContent: '!',
  },
]);
```

Use `gutterContent: null` to suppress built-in gutter content for a line.

### WidgetDecoration

```ts
interface WidgetDecoration {
  id: string;
  type: 'widget';
  offset: number;
  create(): HTMLElement;
  side?: 'before' | 'after';
}
```

`create()` is called during each render. Return a new element each time.

```ts
api.setDecorations([
  {
    type: 'widget',
    offset: 5,
    side: 'after',
    create() {
      const badge = document.createElement('span');
      badge.textContent = '!';
      badge.title = 'Diagnostic available';

      return badge;
    },
  },
]);
```

## Selection And Cursor UI

The plugin API exposes selection as plain-text offsets, not DOM ranges.

```ts
let unsubscribe: (() => void) | undefined;

editor.usePlugin({
  mount(api) {
    unsubscribe = api.onCursorMove((selectionStart, selectionEnd) => {
      if (selectionStart !== selectionEnd) {
        return;
      }

      const word = api.getWordAtCursor();
      const rect = api.getCursorRect();

      if (word && rect) {
        showCompletion(word, rect);
      }
    });
  },

  destroy() {
    unsubscribe?.();
  },
});
```

`getCursorRect()` returns viewport coordinates, suitable for popovers and autocomplete panels.

## Stylesheet Injection

The editor, lines, marks, widgets, and diagnostics live inside the component shadow root.
Document styles do not reach them, so plugins should inject decoration CSS through
`api.adoptStyleSheet()`.

```ts
editor.usePlugin({
  mount(api) {
    api.adoptStyleSheet(`
      .keyword { color: var(--editor-syntax-keyword); font-weight: 600; }
      .string { color: var(--editor-syntax-string); }

      .line[data-message-class~="error"][data-message]::after {
        color: var(--editor-diagnostic-error);
        font-style: italic;
      }
    `);
  },
});
```

Adopted sheets are removed automatically when the plugin is unmounted. You can also pass a
shared `CSSStyleSheet` instance:

```ts
const sharedSheet = new CSSStyleSheet();
sharedSheet.replaceSync('.keyword { color: rebeccapurple; }');

editor.usePlugin({
  mount(api) {
    api.adoptStyleSheet(sharedSheet);
  },
});
```

## HTML Highlighter Bridge

Use `highlight()` when a highlighter returns HTML token spans. The returned HTML is parsed as a
decoration source; it is not inserted as live editor HTML.

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

If you need to merge HTML-derived marks with other plugin decorations, parse explicitly in
`update()`:

```ts
editor.usePlugin({
  update(value, api) {
    const html = highlight(value);
    const syntax = api.parseDecorationsFromHtml(html);
    const diagnostics = lint(value);

    api.setDecorations([...syntax, ...diagnostics]);
  },
});
```

## Token-Based Decoration

`decorationsFromTokens()` converts flat tokens into mark decorations. Token offsets must be
absolute character offsets.

```ts
interface Token {
  from: number;
  to: number;
  type: string;
  scopes?: string[];
}
```

```ts
editor.usePlugin({
  update(value, api) {
    const tokens = tokenizer.tokenize(value);

    api.setDecorations(
      api.decorationsFromTokens(tokens, {
        keyword: { bold: true, color: 'var(--editor-syntax-keyword)' },
        string: { color: 'var(--editor-syntax-string)' },
        comment: { italic: true, color: 'var(--editor-syntax-comment)' },
      }),
    );
  },
});
```

For ready-made Lezer, Unified, and Shiki adapters, install `@rcarls/rc-textarea-adapters`.

## Helpers From `@rcarls/rc-textarea`

### `matchPatternResults(value, patterns)`

Use `matchPatternResults()` when a plugin needs to combine pattern results with other
decorations in one `setDecorations()` call.

```ts
import { matchPatternResults } from '@rcarls/rc-textarea';

const patterns = [
  { id: 'kw-function', pattern: /\bfunction\b/g, bold: true, className: 'keyword' },
  { id: 'kw-return', pattern: /\breturn\b/g, bold: true, className: 'keyword' },
];

editor.usePlugin({
  update(value, api) {
    const { markDecorations, lineDecorations } = matchPatternResults(value, patterns);

    api.setDecorations([...markDecorations, ...lineDecorations, ...lint(value)]);
  },
});
```

### `createLineDecoratorPlugin(decorator, options?)`

Use `createLineDecoratorPlugin()` for line-by-line logic. Mark offsets returned from
`decorateLine()` are relative to the start of the line; the helper converts them to absolute
document offsets.

```ts
import { createLineDecoratorPlugin, type LineDecoratorPlugin } from '@rcarls/rc-textarea';

const keywordDecorator: LineDecoratorPlugin = {
  styles: '.keyword { font-weight: 600; color: var(--editor-syntax-keyword); }',

  decorateLine(line) {
    const decorations = [];

    for (const match of line.matchAll(/\bfunction\b/g)) {
      decorations.push({
        type: 'mark' as const,
        from: match.index,
        to: match.index + match[0].length,
        className: 'keyword',
      });
    }

    return decorations;
  },
};

editor.usePlugin(createLineDecoratorPlugin(keywordDecorator));
```

`extraDecorations` merges whole-document results into the line decorator output:

```ts
editor.usePlugin(
  createLineDecoratorPlugin(myLineDecorator, {
    extraDecorations(value) {
      return lint(value).map((diagnostic) => ({
        type: 'line' as const,
        line: diagnostic.line,
        message: diagnostic.message,
        messageClassName: 'error',
      }));
    },
  }),
);
```

`watch` lets external state trigger `api.scheduleUpdate()`:

```ts
editor.usePlugin(
  createLineDecoratorPlugin(myLineDecorator, {
    watch: [
      (onChange) => {
        window.addEventListener('theme-change', onChange);

        return () => window.removeEventListener('theme-change', onChange);
      },
    ],
  }),
);
```

## Recipes

### Pattern With Diagnostic Message

```ts
editor.addPattern({
  pattern: /\bFIXME\b/g,
  bold: true,
  color: 'var(--editor-diagnostic-error)',
  underline: 'wavy',
  createLineDecoration: () => ({
    className: 'line-error',
    message: 'Review before release',
    messageClassName: 'error',
    gutterContent: '!',
  }),
});
```

### Read-Only Preview Transform

```ts
editor.readOnly = true;

editor.usePlugin({
  transform(value) {
    return value.trimEnd();
  },

  update(value, api) {
    api.setDecorations(parsePreviewDecorations(value));
  },
});
```

### Accessing The Slotted Textarea

```ts
editor.usePlugin({
  mount(api) {
    const textarea = api.host.querySelector('textarea');

    if (!textarea) {
      return;
    }

    console.log(textarea.name, textarea.maxLength);
  },
});
```

## Troubleshooting

### Decorations Disappear After Large Edits

Plugin decorations are remapped through edits, but very large text changes clear mapped plugin
decorations to avoid stale offsets. Recompute plugin decorations in `update()` for durable
results.

```ts
editor.usePlugin({
  update(value, api) {
    api.setDecorations(parseText(value));
  },
});
```

Pattern decorations and `decorations` property values are rebuilt on each render.

### Cursor Position Looks Different After Decorations Change

Selection is restored through plain-text offsets. Widgets have no text width in the value, and
new decorations can change the visual shape around the same offset. Use `getCursorRect()` for
positioning UI instead of assuming a stable DOM node.

### Styles Do Not Apply To Marks Or Lines

Decoration elements are in the shadow root. Use `api.adoptStyleSheet()` rather than a document
stylesheet.

### HTML Highlighting Duplicates Decorations

Returning a string from `highlight()` adds parsed marks to existing plugin decorations. If you
need exact replacement or merging behavior, do all work inside `update()` and call
`api.setDecorations()`.
