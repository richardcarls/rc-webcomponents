# rc-textarea-v2

A WAI-ARIA compliant enhanced textarea web component built with [Lit 3](https://lit.dev) and [Parchment](https://github.com/quilljs/parchment). Uses a `contenteditable` div as its editing surface, enabling inline visual formatting (bold, italic, color, underlines) that is impossible with a plain `<textarea>`.

**rc-textarea-v2 is not a rich text editor.** The underlying value is always plain text. Decorations are applied visually only — entirely through the JavaScript API, not through user action.

Key capabilities:

- **Mixed inline formatting** — bold, italic, color, background, underline styles on arbitrary character ranges
- **Error-lens style line annotations** — end-of-line messages (like VS Code's error lens)
- **Inline widgets** — non-editable DOM elements inserted at any character offset
- **Regex pattern decorations** — auto-decorate text matching regular expressions
- **Plugin API** — imperative decoration control + highlight.js / prism.js HTML compatibility bridge
- **Line numbers**, **word wrap**, **auto-grow**
- **Progressive enhancement** — wraps a native `<textarea>` for form submission; the textarea is hidden, the `contenteditable` div is the interaction surface
- **Custom undo/redo** — DOM rebuilds invalidate the browser's native undo stack; the component maintains its own

---

## Architecture (for AI agents)

```
rc-textarea-v2 (LitElement shadow host)
├── #root (flex container)
│   ├── #gutter (line numbers, optional)
│   └── #editor-area
│       ├── #editor (contenteditable div — Parchment ScrollBlot root)
│       │   └── .v2-line divs (V2BlockBlot per line)
│       │       ├── text nodes (plain text)
│       │       ├── .v2-mark spans (V2InlineBlot — mark decorations)
│       │       ├── .v2-widget spans (V2WidgetBlot — inline widgets, contenteditable=false)
│       │       └── [data-message] attr → ::after pseudo-element (error-lens annotations)
│       └── <slot> (lightDOM textarea — hidden, form-only)
```

**Parchment usage**: `V2ScrollBlot` wraps `#editor` and suppresses Parchment's MutationObserver. Parchment blot classes (`V2BlockBlot`, `V2InlineBlot`, `V2WidgetBlot`) provide structured DOM creation via their static `create()` methods. `V2Document.build()` tears down and fully rebuilds the blot tree on every render frame (RAF-batched).

**Editing loop**: browser handles edit → `input` saves cursor position + extracts plain text → maps decorations through change → dispatches events → schedules RAF → `_performRender()` rebuilds DOM → restores cursor.

**Cursor management** (`selection.ts`): `saveSelection()` converts a DOM selection to plain-text character offsets (skipping widget spans). `restoreSelection()` converts back after DOM rebuild.

**Source files**:

| File | Role |
|------|------|
| `src/rc-textarea-v2.ts` | Main Lit element — editing loop, plugin/pattern management, form wiring |
| `src/document.ts` | `V2Document` — builds Parchment tree from text + decorations; `extractEditorText()` |
| `src/blots.ts` | Parchment blot subclasses + registry |
| `src/selection.ts` | `saveSelection()` / `restoreSelection()` for contenteditable |
| `src/decoration.ts` | `mapDecorationsThroughChange()`, `isLargeChange()`, `findEdit()` |
| `src/pattern-matcher.ts` | Regex patterns → mark/line decorations |
| `src/types.ts` | All exported types |
| `src/rc-textarea-v2.styles.ts` | Component CSS and custom properties |

---

## Installation

```bash
npm install @rcarls/rc-textarea-v2
# or
yarn add @rcarls/rc-textarea-v2
```

Import to auto-register the custom element:

```ts
import '@rcarls/rc-textarea-v2';
```

Or import the class for typed access:

```ts
import { RCTextareaV2 } from '@rcarls/rc-textarea-v2';
```

---

## Basic Usage

Slot a native `<textarea>` as the direct child. It is hidden from view and used only for form wiring.

```html
<rc-textarea-v2>
  <textarea name="body" rows="10" placeholder="Start typing…"></textarea>
</rc-textarea-v2>
```

The component adopts the textarea's `name`, `required`, `disabled`, `maxlength`, `placeholder`, and initial `value`. Form submission reads the textarea's value, which is kept in sync by the component.

---

## Attributes / Properties

| Attribute | Property | Type | Default | Description |
|-----------|----------|------|---------|-------------|
| `line-numbers` | `lineNumbers` | `boolean` | `false` | Show line number gutter |
| `word-wrap` | `wordWrap` | `boolean` | `false` | Enable word wrap |
| `auto-grow` | `autoGrow` | `boolean` | `false` | Grow to fit content |
| `read-only` | `readOnly` | `boolean` | `false` | Disable editing |
| `label` | `label` | `string\|null` | `null` | Sets `aria-label` on the editor div |

```html
<rc-textarea-v2 line-numbers word-wrap auto-grow>
  <textarea name="notes" rows="8"></textarea>
</rc-textarea-v2>
```

---

## Value Property

```ts
const el = document.querySelector('rc-textarea-v2');

// Read current plain text
console.log(el.value);

// Set programmatically — maps existing decorations through the change
el.value = 'new content here';
```

---

## Events

All events bubble and are composed (cross shadow boundary).

| Event | Detail | Fires when |
|-------|--------|------------|
| `rc-textarea-v2-change` | `{ value: string }` | Text changes |
| `rc-textarea-v2-focus` | — | Editor receives focus |
| `rc-textarea-v2-blur` | — | Editor loses focus |
| `rc-textarea-v2-select` | `{ selectionStart: number, selectionEnd: number }` | Selection changes |

```ts
el.addEventListener('rc-textarea-v2-change', (e) => {
  console.log(e.detail.value);
});
```

---

## CSS Custom Properties

Set on the host element or any ancestor.

| Property | Default | Description |
|----------|---------|-------------|
| `--rc-textarea-v2-font-family` | `monospace` | Font family |
| `--rc-textarea-v2-font-size` | `1em` | Font size |
| `--rc-textarea-v2-line-height` | `1.5` | Line height |
| `--rc-textarea-v2-padding` | `0.5em` | Inner padding |
| `--rc-textarea-v2-background` | `Field` | Editor background |
| `--rc-textarea-v2-color` | `FieldText` | Text color |
| `--rc-textarea-v2-caret-color` | (color) | Caret/cursor color |
| `--rc-textarea-v2-border` | `1px solid ButtonBorder` | Border |
| `--rc-textarea-v2-border-radius` | `2px` | Border radius |
| `--rc-textarea-v2-focus-outline` | `2px solid AccentColor` | Focus ring |
| `--rc-textarea-v2-gutter-color` | `GrayText` | Line number text color |
| `--rc-textarea-v2-gutter-bg` | `Canvas` | Gutter background |
| `--rc-textarea-v2-gutter-border` | `1px solid ButtonBorder` | Gutter right border |

---

## CSS Parts

| Part | Element |
|------|---------|
| `root` | Outer flex container |
| `gutter` | Line number gutter |
| `line-numbers` | Line number elements container |
| `editor-area` | Container for editor + slot |
| `editor` | The contenteditable div |

```css
rc-textarea-v2::part(editor) { border-radius: 4px; }
rc-textarea-v2::part(gutter) { font-size: 0.8em; }
```

---

## Plugin API

Plugins are the primary mechanism for applying decorations. Plugins receive a `RCTextareaV2PluginAPI` object through `mount()` — **save this reference** to set decorations from outside the plugin:

```ts
let pluginApi: RCTextareaV2PluginAPI;

editor.usePlugin({
  mount(api) { pluginApi = api; },
  update() {/* nothing required */},
});

// From anywhere — set decorations imperatively:
pluginApi.setDecorations([
  { type: 'mark', from: 0, to: 5, bold: true, color: '#ff0000' },
]);
pluginApi.scheduleUpdate();
```

### `RCTextareaV2Plugin` interface

At least one of `update` or `highlight` must be provided.

```ts
interface RCTextareaV2Plugin {
  mount?(api: RCTextareaV2PluginAPI): void;   // Called when plugin is registered
  destroy?(): void;                            // Called on removePlugin() or disconnect

  // Imperative API — called on each value change
  update?(value: string, api: RCTextareaV2PluginAPI): void | Promise<void>;

  // HTML-based compat — return HTML (e.g. from hljs/prism), parsed to mark decorations
  highlight?(value: string, api: RCTextareaV2PluginAPI):
    string | null | void | Promise<string | null | void>;
}
```

### `RCTextareaV2PluginAPI` interface

```ts
interface RCTextareaV2PluginAPI {
  readonly host: HTMLElement;         // The rc-textarea-v2 element
  readonly value: string;             // Current plain text value

  addDecoration(d: DecorationInput): string;
  removeDecoration(id: string): void;
  clearDecorations(): void;
  setDecorations(decorations: DecorationInput[]): void;

  scheduleUpdate(): void;             // Trigger render outside of input events

  // Inject a stylesheet into the component's shadow root.
  // Pass a CSSStyleSheet or a raw CSS text string.
  // Returns the adopted sheet. Automatically removed on plugin unmount.
  adoptStyleSheet(sheetOrCssText: CSSStyleSheet | string): CSSStyleSheet;
  removeStyleSheet(sheet: CSSStyleSheet): void;

  // Parse highlight.js / prism.js HTML output into MarkDecoration objects
  decorationsFromHtml(html: string): Omit<MarkDecoration, 'id'>[];
}
```

### Example — synchronous imperative plugin

```ts
import { RCTextareaV2Plugin } from '@rcarls/rc-textarea-v2';

const markdownLitePlugin: RCTextareaV2Plugin = {
  update(value, api) {
    const decorations = [];

    // Bold: **text**
    const boldRe = /\*\*(.+?)\*\*/g;
    let m;
    while ((m = boldRe.exec(value)) !== null) {
      decorations.push({ type: 'mark', from: m.index, to: m.index + m[0].length, bold: true });
    }

    api.setDecorations(decorations);
  },
};

editor.usePlugin(markdownLitePlugin);
```

### Example — async plugin (WASM / web worker)

```ts
editor.usePlugin({
  async update(value, api) {
    // Stale results are automatically discarded if a newer render starts
    const decorations = await myWasmParser.tokenize(value);
    api.setDecorations(decorations);
  },
});
```

### Example — highlight.js

```ts
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
hljs.registerLanguage('javascript', javascript);

editor.usePlugin({
  mount(api) {
    // hljs token class spans live inside the shadow root — page CSS cannot
    // pierce the shadow boundary. Inject token colors via adoptStyleSheet().
    // The sheet is automatically removed when the plugin is unmounted.
    api.adoptStyleSheet(`
      .hljs-keyword { color: #cba6f7; }
      .hljs-string  { color: #a6e3a1; }
      .hljs-number  { color: #fab387; }
      .hljs-comment { color: #6c7086; font-style: italic; }
      .hljs-title   { color: #89b4fa; }
      .hljs-built_in { color: #89dceb; }
    `);
  },
  highlight(value, api) {
    // hljs.highlight() returns HTML — decorationsFromHtml() converts it to decorations
    const { value: html } = hljs.highlight(value, { language: 'javascript' });
    api.setDecorations(api.decorationsFromHtml(html));
  },
});
```

> **Shadow DOM note**: `decorationsFromHtml()` applies `hljs-*` class names to `.v2-mark` spans inside the shadow root. Light-DOM stylesheets do not pierce the shadow boundary, so the theme CSS must be injected via `api.adoptStyleSheet()` as shown above.

### Example — Prism.js

```ts
import Prism from 'prismjs';

editor.usePlugin({
  highlight(value, api) {
    const html = Prism.highlight(value, Prism.languages.javascript, 'javascript');
    api.setDecorations(api.decorationsFromHtml(html));
  },
});
```

### Replacing the plugin

Only one plugin can be active at a time. `usePlugin()` calls `destroy()` on the previous plugin before mounting the new one.

```ts
editor.usePlugin(newPlugin);  // replaces old plugin
editor.removePlugin();        // removes plugin, clears all plugin decorations
```

---

## Decoration Types

```ts
import type { MarkDecoration, LineDecoration, WidgetDecoration, DecorationInput } from '@rcarls/rc-textarea-v2';
```

### `MarkDecoration` — styled character range

```ts
interface MarkDecoration {
  id: string;           // Auto-assigned — omit when passing to API
  type: 'mark';
  from: number;         // Inclusive start (0-based char offset into plain text)
  to: number;           // Exclusive end
  className?: string;   // Extra CSS class on the span
  bold?: boolean;
  italic?: boolean;
  color?: string;       // CSS color value
  background?: string;  // CSS color value
  underline?: 'solid' | 'wavy' | 'dotted' | 'dashed';
  underlineColor?: string;
  attributes?: Record<string, string>;  // Extra HTML attributes
}
```

### `LineDecoration` — whole-line styling + error-lens annotation

```ts
interface LineDecoration {
  id: string;
  type: 'line';
  line: number;              // 1-based logical line number
  className?: string;        // Added to the .v2-line div
  message?: string;          // Error-lens text — rendered via ::after pseudo-element,
                             // so it is fully excluded from selection and clipboard
  messageClassName?: string; // Space-separated class(es) set as data-message-class on
                             // the line div; target with [data-message-class~="cls"]::after
  attributes?: Record<string, string>;
}
```

Error-lens messages are rendered via a CSS `::after` pseudo-element (not a real DOM node), keeping them completely outside the selection and clipboard path. Style them in your adopted stylesheet:

```css
/* inside a sheet adopted via api.adoptStyleSheet() or the component's own CSS */
.v2-line[data-message-class~="error"]::after  { color: #f38ba8; }
.v2-line[data-message-class~="warning"]::after { color: #f9e2af; }
```

### `WidgetDecoration` — non-editable inline element

Widgets are purely visual and do not appear in the value string.

```ts
interface WidgetDecoration {
  id: string;
  type: 'widget';
  offset: number;          // Char offset — widget placed before/after this position
  create(): HTMLElement;   // Factory called each render — must return a new element
  side?: 'before' | 'after';  // Default: 'before'
}
```

---

## Pattern API

Patterns automatically apply decorations to all regex matches on every value change, without any event handling code.

```ts
// Bold + orange all occurrences of "TODO"
const id = editor.addPattern({
  pattern: /\bTODO\b/,
  bold: true,
  color: '#fab387',
});

// Remove a specific pattern
editor.removePattern(id);

// Remove all patterns
editor.clearPatterns();
```

### `TextPattern` interface

All `MarkDecoration` formatting properties are supported as top-level pattern fields.

```ts
interface TextPattern {
  id: string;               // Auto-assigned — omit when calling addPattern()
  pattern: RegExp;          // Global flag is added automatically
  className?: string;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  background?: string;
  underline?: 'solid' | 'wavy' | 'dotted' | 'dashed';
  underlineColor?: string;
  attributes?: Record<string, string>;
  // Error-lens annotation for matching lines:
  createLineDecoration?: (match: RegExpMatchArray) =>
    | Omit<LineDecoration, 'id' | 'type' | 'line'>
    | null;
}
```

### Example — pattern with error-lens annotation

```ts
editor.addPattern({
  pattern: /\bFIXME\b/,
  color: '#f38ba8',
  underline: 'wavy',
  underlineColor: '#f38ba8',
  createLineDecoration: (match) => ({
    className: 'fixme-line',
    message: 'Needs fixing before release',
    messageClassName: 'fixme-message',
  }),
});
```

---

## Decoration Lifecycle

Decorations (set via `pluginApi.setDecorations()`) are mapped through text edits automatically:

- **Before the edit region**: unchanged
- **After the edit region**: shifted by the character delta
- **Overlapping the edit**: clamped to edit boundaries or dropped if zero-width
- **Large changes** (paste, select-all+type — heuristic: > 50 chars AND > 50% of document): all plugin decorations are cleared to avoid mapping errors

Pattern decorations are always fully recomputed on each change.

---

## Undo / Redo

The component manages its own undo stack because DOM rebuilds (which happen on every render frame) invalidate the browser's native contenteditable undo history.

- **Ctrl+Z** / **Cmd+Z**: undo
- **Ctrl+Y** / **Cmd+Y** / **Ctrl+Shift+Z**: redo
- Stack depth: 100 entries

The undo stack stores plain text values + cursor positions. Decorations are not part of the undo state — they are recomputed from the restored value.

---

## Keyboard Behaviour

| Key | Behaviour |
|-----|-----------|
| `Tab` | Inserts a `\t` character (does not move focus) |
| `Ctrl/Cmd+Z` | Undo |
| `Ctrl/Cmd+Y` / `Ctrl/Cmd+Shift+Z` | Redo |
| `Paste` | Strips HTML/rich text — only plain text is inserted |

---

## Form Integration

The lightDOM `<textarea>` participates in form submission normally. The component:

1. Hides the textarea visually (inline styles: `position:absolute; clip; opacity:0`)
2. Removes it from tab order (`tabindex=-1`)
3. Keeps its `value` in sync on every edit
4. Forwards `invalid` events to set `aria-invalid` on the editor

```html
<form>
  <rc-textarea-v2>
    <textarea name="content" required></textarea>
  </rc-textarea-v2>
  <button type="submit">Submit</button>
</form>
```

---

## Differences from rc-textarea

| Feature | rc-textarea | rc-textarea-v2 |
|---------|-------------|----------------|
| Editing surface | Native `<textarea>` | `contenteditable` div |
| Decoration rendering | Mirror div (innerHTML) | Parchment blot tree |
| Mixed font formatting | Not supported | ✓ (bold, italic, color…) |
| Decoration API | `protected` (internal) | On `PluginAPI` (via `mount()`) |
| Plugin API | `highlight()` → HTML string | `update()` (imperative) + `highlight()` (HTML compat) |
| Diagnostics API | Built-in (`addDiagnostic` etc.) | Not built-in — use `LineDecoration.message` |
| Inline widgets | Not supported | ✓ (`WidgetDecoration`) |
| Undo/redo | Browser native | Custom stack |
| Document model | Line-oriented text | Parchment blot tree |

---

## Common Pitfalls

### Decorations must be set via the PluginAPI

There is no `addDecoration()` on the element itself. All imperative decoration control goes through `api` received in `mount()`:

```ts
// Wrong — no such method on the element
editor.addDecoration({ type: 'mark', from: 0, to: 5, bold: true });

// Correct
let api;
editor.usePlugin({ mount(a) { api = a; }, update() {} });
api.setDecorations([{ type: 'mark', from: 0, to: 5, bold: true }]);
api.scheduleUpdate();
```

### Widget factories must return a new element each render

`WidgetDecoration.create()` is called on every render cycle. Do not return a cached element — the previous element will have been detached from the DOM.

### hljs/prism CSS classes require shadow root stylesheet adoption

`decorationsFromHtml()` applies class names from `<span class="hljs-keyword">` etc. to `.v2-mark` spans inside the shadow root. Light-DOM stylesheets (including linked hljs theme files) do not pierce the shadow boundary.

Use `api.adoptStyleSheet()` inside `mount()` to inject the token colors into the shadow root. The sheet is removed automatically when the plugin is unmounted:

```ts
editor.usePlugin({
  mount(api) {
    api.adoptStyleSheet(`
      .hljs-keyword { color: #cba6f7; }
      .hljs-string  { color: #a6e3a1; }
      /* ... */
    `);
    // Or adopt a pre-built CSSStyleSheet shared across multiple editors:
    // api.adoptStyleSheet(sharedThemeSheet);
  },
  highlight(value, api) { /* ... */ },
});
```

Alternatively, skip class-based styling entirely and use `MarkDecoration.color`, `bold`, etc. to apply formatting as inline styles.

### One plugin at a time

`usePlugin()` replaces the active plugin (calling `destroy()` on the previous one). Combine logic into one plugin rather than registering multiple.

### `value` setter replaces the full document

Setting `el.value = '...'` programmatically replaces the entire content and triggers a full render. Plugin decorations are not automatically remapped across this operation — call `api.clearDecorations()` before or after if needed.
