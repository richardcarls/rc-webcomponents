# rc-textarea

A WAI-ARIA compliant enhanced textarea web component built with [Lit 3](https://lit.dev) and [Parchment](https://github.com/quilljs/parchment). Uses a `contenteditable` div as its editing surface, enabling inline visual formatting (bold, italic, color, underlines) that is impossible with a plain `<textarea>`.

**rc-textarea is not a rich text editor.** The underlying value is always plain text. Decorations are applied visually only — entirely through the JavaScript API, not through user action.

---

## Table of Contents

1. [Key Capabilities](#key-capabilities)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Basic Usage](#basic-usage)
5. [Attributes & Properties](#attributes--properties)
6. [Value Property](#value-property)
7. [Events](#events)
8. [CSS Customization](#css-customization)
9. [Plugin API](#plugin-api)
10. [Decoration Types](#decoration-types)
11. [Pattern API](#pattern-api)
12. [Plugin Helpers](#plugin-helpers)
13. [Selection API](#selection-api)
14. [Decoration Lifecycle](#decoration-lifecycle)
15. [Undo / Redo](#undo--redo)
16. [Keyboard Behavior](#keyboard-behavior)
17. [Form Integration](#form-integration)
18. [Accessibility](#accessibility)
19. [Performance Considerations](#performance-considerations)
20. [Troubleshooting](#troubleshooting)

---

## Key Capabilities

- **Mixed inline formatting** — bold, italic, color, background, underline styles on arbitrary character ranges
- **Error-lens style line annotations** — end-of-line messages (like VS Code's error lens)
- **Inline widgets** — non-editable DOM elements inserted at any character offset
- **Regex pattern decorations** — auto-decorate text matching regular expressions
- **Plugin API** — imperative decoration control + highlight.js / prism.js HTML compatibility bridge
- **Line numbers, word wrap, auto-grow** — feature flags for common use cases
- **Progressive enhancement** — wraps a native `<textarea>` for form submission; the textarea is hidden, the `contenteditable` div is the interaction surface
- **Custom undo/redo** — DOM rebuilds invalidate the browser's native undo stack; the component maintains its own
- **Accessible by default** — `role="textbox"`, `aria-multiline="true"`, spellcheck disabled, focus management

---

## Architecture

### DOM Structure

```
rc-textarea (LitElement shadow host, delegatesFocus=true)
├── #root (flex container)
│   ├── #gutter (line/list/custom gutter, optional)
│   │   └── #gutter-cells (container for .gutter-cell spans, one per line)
│   └── #editor-area (flex item, grows to fill)
│       ├── #editor (contenteditable div — Parchment ScrollBlot root)
│       │   └── .v2-line divs (one per logical line, V2BlockBlot)
│       │       ├── text nodes (plain text content)
│       │       ├── .v2-mark spans (V2InlineBlot — mark decorations)
│       │       ├── .v2-widget spans (V2WidgetBlot — inline widgets, contenteditable=false)
│       │       └── [data-message] attr (error-lens: used by ::after pseudo-element)
│       └── <slot> (lightDOM textarea — hidden, form-only)
```

**Shadow DOM usage**: `delegatesFocus=true` ensures focus management works correctly. Line numbers are in the shadow DOM but read-only.

### Editing Loop (Data Flow)

1. **Browser handles edit** — User types/pastes/deletes text in the contenteditable div
2. **`input` event fires** → `_onInput()` handler:
   - Save DOM selection to plain-text offsets via `saveSelection()`
   - Extract plain text via `extractEditorText()`
   - Update `this._value`
   - Dispatch `rc-textarea-change` event
   - Map existing decorations through the text change via `mapDecorationsThroughChange()`
   - Schedule RAF render pass
3. **RAF render pass** → `_performRender()`:
   - Extract plugin decorations
   - Re-run patterns (rebuild all pattern decorations from regex)
   - Ask plugin for new decorations (call `plugin.update()` or `plugin.highlight()`)
   - Build `V2Document` from text + all decorations
   - Tear down and fully rebuild the blot tree
   - Restore DOM selection via `restoreSelection()`
   - Update line number gutter if `lineNumbers=true`
4. **Decorations stay in sync** — All existing decorations persist through edits (mapped to new offsets)

**Key insight for LLM agents**: The blot tree is **rebuilt on every render frame**. This is necessary because decoration changes require DOM restructuring. The undo stack stores plain-text values, not DOM snapshots.

### Parchment Integration

- **`V2ScrollBlot`** wraps the `#editor` div and suppresses Parchment's `MutationObserver` (which would fight with our render loop)
- **`V2BlockBlot`** represents a single line (`.v2-line` div)
- **`V2InlineBlot`** represents a mark decoration (`.v2-mark` span)
- **`V2WidgetBlot`** represents an inline widget (`.v2-widget` span, `contenteditable=false`)
- **`V2Document`** class contains the build logic: `build(text, decorations) → BlotTree`

The blot tree is **immutable** — each render creates a new tree from scratch, then the DOM is replaced.

### Cursor Management

Plain-text offsets are essential for:
- Storing selection state across DOM rebuilds
- Decoration `from`/`to` ranges
- Plugin API (selection, cursor position)
- Undo/redo stack

**`selection.ts` module**:
- `saveSelection()` — convert DOM range to plain-text offsets, skipping widget spans
- `restoreSelection()` — convert plain-text offsets back to DOM range after rebuild

### File Organization

| File | Purpose |
|------|---------|
| `src/rc-textarea.ts` | Main LitElement: editing loop, plugin/pattern management, form wiring, undo/redo stack, gutter, event dispatch |
| `src/document.ts` | `V2Document` class — builds Parchment tree from text + decorations; `extractEditorText()` reverse operation |
| `src/blots.ts` | Parchment blot subclasses (`V2ScrollBlot`, `V2BlockBlot`, `V2InlineBlot`, `V2WidgetBlot`) + blot registry |
| `src/selection.ts` | `saveSelection()` / `restoreSelection()` for plain-text ↔ DOM range conversion |
| `src/decoration.ts` | `mapDecorationsThroughChange()` — map existing decorations through text edits; `isLargeChange()` heuristic |
| `src/pattern-matcher.ts` | `matchPatternResults()` — run `TextPattern` array against text, return mark + line decorations |
| `src/line-decorator.ts` | `createLineDecoratorPlugin()` factory — wraps per-line decoration logic in a full `RCTextareaPlugin` |
| `src/types.ts` | All exported TypeScript interfaces and utility types |
| `src/rc-textarea.styles.ts` | Component CSS (custom properties, parts, internal layout) |

---

## Installation

```bash
npm install @rcarls/rc-textarea
# or
yarn add @rcarls/rc-textarea
```

Import to auto-register the custom element:

```ts
import '@rcarls/rc-textarea';
```

Or import the class for typed access:

```ts
import { RCTextarea } from '@rcarls/rc-textarea';
```

---

## Basic Usage

Slot a native `<textarea>` as the direct child. It is hidden from view and used only for form wiring.

```html
<rc-textarea>
  <textarea name="body" rows="10" placeholder="Start typing…"></textarea>
</rc-textarea>
```

The component adopts the textarea's `name`, `required`, `disabled`, `maxlength`, `placeholder`, and initial `value`. Form submission reads the textarea's value, which is kept in sync by the component.

### JavaScript access

```ts
const editor = document.querySelector('rc-textarea');

// Read current plain text
console.log(editor.value);

// Set programmatically
editor.value = 'new content';

// Track changes
editor.addEventListener('rc-textarea-change', (e) => {
  console.log('New value:', e.detail.value);
});
```

---

## Attributes & Properties

All attributes reflect to properties. Use attributes in HTML or properties in JS.

| Attribute | Property | Type | Default | Description |
|-----------|----------|------|---------|-------------|
| `line-numbers` | `lineNumbers` | `boolean` | `false` | Display line number gutter on the left |
| `list-numbers` | `listNumbers` | `boolean` | `false` | Display a numbered list gutter (skips blank lines, resets counter) |
| `gutter` | `gutter` | `boolean` | `false` | Show a gutter column without built-in content (plugins fill cells via `LineDecoration.gutterContent`) |
| `word-wrap` | `wordWrap` | `boolean` | `false` | Enable word wrapping (default: scroll horizontally) |
| `auto-grow` | `autoGrow` | `boolean` | `false` | Grow container height to fit content |
| `read-only` | `readOnly` | `boolean` | `false` | Disable text editing; still selectable |
| `label` | `label` | `string \| null` | `null` | Sets `aria-label` on the editor div |

### Example

```html
<rc-textarea 
  id="code-editor" 
  line-numbers 
  word-wrap 
  auto-grow
  label="Code editor"
>
  <textarea name="code" rows="20"></textarea>
</rc-textarea>
```

```ts
const editor = document.querySelector('#code-editor');
console.log(editor.lineNumbers);  // true
console.log(editor.wordWrap);     // true
```

---

## Value Property

```ts
const editor = document.querySelector('rc-textarea');

// Read
const plainText = editor.value;

// Write — decorations are mapped through the change
editor.value = 'hello world';

// Write via textarea (if slotted)
const textarea = editor.querySelector('textarea');
textarea.value = 'test';
editor.value = textarea.value;  // sync if needed
```

Setting `value` programmatically:
1. Updates `this._value` and the slotted textarea
2. Dispatches `rc-textarea-change` event
3. Schedules a RAF render pass
4. Existing decorations are **mapped through the change** (shifted, clamped, or cleared)

---

## Events

All events bubble and are composed (cross shadow boundary).

| Event | Detail | Fires when |
|-------|--------|------------|
| `rc-textarea-change` | `{ value: string }` | Text changes (input, paste, undo/redo, programmatic `value` set) |
| `rc-textarea-focus` | (empty) | Editor receives focus |
| `rc-textarea-blur` | (empty) | Editor loses focus |
| `rc-textarea-select` | `{ selectionStart: number, selectionEnd: number }` | Selection changes (cursor move, click, keyboard nav) |

### Example

```ts
const editor = document.querySelector('rc-textarea');

editor.addEventListener('rc-textarea-change', (e) => {
  console.log('Text changed to:', e.detail.value);
});

editor.addEventListener('rc-textarea-select', (e) => {
  const { selectionStart, selectionEnd } = e.detail;
  console.log(`Selection: ${selectionStart}–${selectionEnd}`);
});

editor.addEventListener('rc-textarea-focus', () => {
  console.log('Editor focused');
});
```

---

## CSS Customization

### Custom Properties

Set on the host element or any ancestor to style the editor.

| Property | Default | Description |
|----------|---------|-------------|
| `--rc-textarea-font-family` | `monospace` | Font family for text and line numbers |
| `--rc-textarea-font-size` | `1em` | Base font size |
| `--rc-textarea-line-height` | `1.5` | Line height affects gutter alignment |
| `--rc-textarea-padding` | `0.5em` | Inner padding of editor area |
| `--rc-textarea-background` | `Field` | Editor background color (system color keyword) |
| `--rc-textarea-color` | `FieldText` | Text color (system color keyword) |
| `--rc-textarea-caret-color` | (auto) | Cursor/caret color |
| `--rc-textarea-border` | `1px solid ButtonBorder` | Editor border (system color keyword) |
| `--rc-textarea-border-radius` | `2px` | Corner rounding |
| `--rc-textarea-focus-outline` | `2px solid AccentColor` | Focus ring (system color keyword) |
| `--rc-textarea-active-line-bg` | `transparent` | Background of the line containing the cursor |
| `--rc-textarea-gutter-color` | `GrayText` | Line number text color |
| `--rc-textarea-gutter-bg` | `Canvas` | Gutter background |
| `--rc-textarea-gutter-border` | `1px solid ButtonBorder` | Gutter right border |
| `--rc-textarea-gutter-padding-inline-end` | `0.75em` | Gap between gutter numbers and editor content |

### Example

```css
rc-textarea {
  --rc-textarea-font-family: 'Fira Code', monospace;
  --rc-textarea-font-size: 13px;
  --rc-textarea-line-height: 1.6;
  --rc-textarea-background: #1e1e2e;
  --rc-textarea-color: #cdd6f4;
  --rc-textarea-caret-color: #89b4fa;
  --rc-textarea-border: 1px solid #313244;
  --rc-textarea-border-radius: 4px;
}
```

### CSS Parts

Use `::part()` pseudo-element for advanced styling.

| Part | Element | Supports |
|------|---------|----------|
| `root` | Outer flex container | All CSS |
| `gutter` | Gutter outer div | All CSS |
| `gutter-cells` | Inner container holding `.gutter-cell` spans | All CSS |
| `editor-area` | Container wrapping editor + slot | All CSS |
| `editor` | The `contenteditable` div | All CSS |

### Example

```css
rc-textarea::part(editor) {
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

rc-textarea::part(gutter) {
  background: #f5f5f5;
  font-size: 0.9em;
}
```

### Mark decoration styling

Inline decorations are applied to `.v2-mark` spans. Inline styles handle standard properties (bold, italic, color, etc.). For custom classes:

```ts
let api: RCTextareaPluginAPI;
editor.usePlugin({
  mount(a) { api = a; },
  update() {},
});

// Add decorations with a custom class
api.setDecorations([
  { type: 'mark', from: 5, to: 10, className: 'my-highlight' }
]);

// Style it in an adopted stylesheet
api.adoptStyleSheet(`
  .v2-mark.my-highlight { background: yellow; }
`);
```

---

## Plugin API

Plugins are the primary mechanism for applying decorations. A plugin receives a `RCTextareaPluginAPI` during `mount()` — **save this reference** to set decorations from outside the plugin lifecycle.

### Interface Overview

```ts
interface RCTextareaPlugin {
  /** Called once when the plugin is registered. Store `api` here for external use. */
  mount?(api: RCTextareaPluginAPI): void;
  /** Called when the plugin is replaced or the element disconnects. */
  destroy?(): void;
  /**
   * Display-layer value transform — called before `update`/`highlight` in
   * read-only mode. Return a non-null string to substitute it as the rendered
   * text. The underlying `element.value` is never modified.
   */
  transform?(value: string, api: RCTextareaPluginAPI): string | null | void;
  /** Imperative decoration API — called on each value change. */
  update?(value: string, api: RCTextareaPluginAPI): void | Promise<void>;
  /**
   * HTML-based compat — called on each value change.
   * Return an HTML string (e.g. from hljs/prism); it will be parsed into
   * mark decorations via `api.decorationsFromHtml()`.
   */
  highlight?(value: string, api: RCTextareaPluginAPI):
    string | null | void | Promise<string | null | void>;
}
```

At least one of `update` or `highlight` must be provided. `transform` is only
called in read-only mode and is typically used to substitute scaled or formatted
display text while preserving the raw underlying value.

### PluginAPI Methods

```ts
interface RCTextareaPluginAPI {
  readonly host: HTMLElement;           // rc-textarea element
  readonly value: string;               // Current plain text
  readonly selectionStart: number;      // Normalized selection start (≤ selectionEnd)
  readonly selectionEnd: number;        // Normalized selection end (≥ selectionStart)

  getCursorRect(): DOMRect | null;      // Cursor position in viewport coords (or null if not focused)
  getWordAtCursor(): { word: string; from: number; to: number } | null;
  onCursorMove(cb: (start: number, end: number) => void): () => void;

  addDecoration(d: DecorationInput): string;        // Add single decoration, return ID
  removeDecoration(id: string): void;               // Remove by ID
  clearDecorations(): void;                         // Remove all plugin decorations
  setDecorations(decorations: DecorationInput[]): void;  // Replace all with new set

  scheduleUpdate(): void;               // Trigger render outside input events

  adoptStyleSheet(sheetOrCssText: CSSStyleSheet | string): CSSStyleSheet;
  removeStyleSheet(sheet: CSSStyleSheet): void;
  decorationsFromHtml(html: string): Omit<MarkDecoration, 'id'>[];
}
```

### Mounting and Lifecycle

```ts
const editor = document.querySelector('rc-textarea');

let api: RCTextareaPluginAPI;

editor.usePlugin({
  mount(a) {
    api = a;  // Save reference for external use
    console.log('Plugin mounted');
  },
  update(value, a) {
    // Called on each value change
    const decorations = parseText(value);
    a.setDecorations(decorations);
  },
  destroy() {
    console.log('Plugin unmounting');
  },
});

// From outside plugin lifecycle, using saved reference
api.setDecorations([
  { type: 'mark', from: 0, to: 5, bold: true }
]);
api.scheduleUpdate();
```

### Example 1: Synchronous Imperative Plugin

Manually find patterns and apply decorations:

```ts
const markdownLitePlugin = {
  update(value, api) {
    const decorations = [];

    // Bold: **text**
    const boldRe = /\*\*(.+?)\*\*/g;
    let m;
    while ((m = boldRe.exec(value)) !== null) {
      decorations.push({
        type: 'mark',
        from: m.index,
        to: m.index + m[0].length,
        bold: true
      });
    }

    // Italic: *text*
    const italicRe = /\*([^*]+)\*/g;
    while ((m = italicRe.exec(value)) !== null) {
      decorations.push({
        type: 'mark',
        from: m.index,
        to: m.index + m[0].length,
        italic: true
      });
    }

    api.setDecorations(decorations);
  },
};

editor.usePlugin(markdownLitePlugin);
```

### Example 2: Asynchronous Plugin (WASM / Web Worker)

```ts
editor.usePlugin({
  async update(value, api) {
    const decorations = await myWasmParser.tokenize(value);
    api.setDecorations(decorations);
  },
});
```

Stale results are automatically discarded if a newer render starts before the promise resolves.

### Example 3: highlight.js Integration

```ts
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
hljs.registerLanguage('javascript', javascript);

editor.usePlugin({
  mount(api) {
    // Inject theme CSS into shadow root (hljs classes live inside)
    api.adoptStyleSheet(`
      .hljs-keyword { color: #cba6f7; }
      .hljs-string  { color: #a6e3a1; }
      .hljs-number  { color: #fab387; }
      .hljs-comment { color: #6c7086; font-style: italic; }
      .hljs-title   { color: #89b4fa; font-weight: bold; }
      .hljs-built_in { color: #89dceb; }
      .hljs-literal { color: #f5c2e7; }
    `);
  },
  highlight(value, api) {
    // hljs.highlight returns HTML with span wrapping syntax tokens
    const { value: html } = hljs.highlight(value, { language: 'javascript' });
    // Convert HTML token markup to decorations
    api.setDecorations(api.decorationsFromHtml(html));
  },
});
```

**Important**: hljs token class spans live inside the shadow root. Light-DOM stylesheets cannot pierce the shadow boundary, so theme CSS must be injected via `api.adoptStyleSheet()`.

### Example 4: Prism.js Integration

```ts
import Prism from 'prismjs';
import 'prismjs/components/prism-python';

editor.usePlugin({
  mount(api) {
    api.adoptStyleSheet(`
      .token.keyword { color: #66d9ef; font-weight: bold; }
      .token.string  { color: #e6db74; }
      .token.number  { color: #ae81ff; }
      .token.comment { color: #75715e; font-style: italic; }
      .token.function { color: #a1efe4; }
    `);
  },
  highlight(value, api) {
    const html = Prism.highlight(value, Prism.languages.python, 'python');
    api.setDecorations(api.decorationsFromHtml(html));
  },
});
```

### Switching / Removing Plugins

Only one plugin can be active at a time. Calling `usePlugin()` with a new plugin calls `destroy()` on the previous one.

```ts
editor.usePlugin(newPlugin);   // previous plugin is destroyed
editor.removePlugin();         // current plugin destroyed, decorations cleared
```

### Accessing Slotted Textarea

Plugins can read the textarea to access its attributes:

```ts
editor.usePlugin({
  mount(api) {
    const textarea = api.host.querySelector('textarea');
    if (textarea) {
      console.log('Form name:', textarea.name);
      console.log('Max length:', textarea.maxLength);
    }
  },
});
```

---

## Decoration Types

Decorations are objects describing visual changes. All decorations are immutable after creation (API methods return new IDs or replace entire sets).

### MarkDecoration — styled character range

A visual style applied to a contiguous range of characters. Inline styles are rendered directly; `className` adds an extra CSS class for complex styling.

```ts
interface MarkDecoration {
  id: string;              // Auto-assigned — omit when passing to API
  type: 'mark';
  from: number;            // Inclusive start (0-based character offset into plain text)
  to: number;              // Exclusive end
  className?: string;      // CSS class added to the span
  bold?: boolean;          // Inline: font-weight: bold
  italic?: boolean;        // Inline: font-style: italic
  color?: string;          // Inline: color (CSS color value)
  background?: string;     // Inline: background-color
  underline?: 'solid' | 'wavy' | 'dotted' | 'dashed';  // text-decoration-style
  underlineColor?: string; // text-decoration-color
  attributes?: Record<string, string>;  // Extra HTML attributes (data-*, title, etc.)
}
```

### LineDecoration — whole-line styling + error-lens annotation

Applied to an entire logical line. Adds a CSS class to the line div and optionally renders an error-lens message at the end.

```ts
interface LineDecoration {
  id: string;
  type: 'line';
  line: number;                    // 1-based logical line number
  className?: string;              // CSS class on the .v2-line div
  message?: string;                // Error-lens text (rendered via ::after, not selectable)
  messageClassName?: string;       // Space-separated class(es) set as data-message-class
  attributes?: Record<string, string>;
  gutterContent?: string | null;   // Override gutter cell text for this line:
                                   //   string  — custom label (e.g. "!", "▶")
                                   //   null    — force empty (suppress built-in content)
                                   //   omitted — use the built-in mode default
}
```

Error-lens messages are rendered via CSS `::after` pseudo-element — they do not appear in selection or clipboard.

```css
/* in an adopted stylesheet */
.v2-line[data-message]::after {
  content: attr(data-message);
  margin-left: 1em;
  color: #f38ba8;
  font-style: italic;
}
```

### WidgetDecoration — non-editable inline element

A DOM element inserted at a character offset. Widgets are purely visual and do not appear in the plain text value.

```ts
interface WidgetDecoration {
  id: string;
  type: 'widget';
  offset: number;           // Character offset — widget placed before/after this position
  create(): HTMLElement;    // Factory called each render — must return a **new** element
  side?: 'before' | 'after';  // Placement relative to character. Default: 'before'
}
```

**Important**: `create()` is called on every render frame. Return a new element each time; do not reuse the same DOM node.

```ts
api.setDecorations([
  {
    type: 'widget',
    offset: 5,
    create() {
      const el = document.createElement('span');
      el.textContent = '👉';
      el.style.color = '#fab387';
      return el;
    },
  },
]);
```

### DecorationInput (for API calls)

When calling `api.addDecoration()`, `api.setDecorations()`, etc., omit the `id` field:

```ts
type DecorationInput = 
  | Omit<MarkDecoration, 'id'>
  | Omit<LineDecoration, 'id'>
  | Omit<WidgetDecoration, 'id'>;
```

---

## Pattern API

Patterns automatically apply decorations to all regex matches on every value change, without manual event handling.

### Adding and Removing Patterns

```ts
const editor = document.querySelector('rc-textarea');

// Boolean pattern — bold + orange all "TODO" occurrences
const patternId = editor.addPattern({
  pattern: /\bTODO\b/g,
  bold: true,
  color: '#fab387',
});

// Remove a specific pattern
editor.removePattern(patternId);

// Remove all patterns
editor.clearPatterns();
```

### TextPattern Interface

```ts
interface TextPattern {
  id: string;               // Auto-assigned — omit when calling addPattern()
  pattern: RegExp;          // Global flag is added automatically if missing
  className?: string;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  background?: string;
  underline?: 'solid' | 'wavy' | 'dotted' | 'dashed';
  underlineColor?: string;
  attributes?: Record<string, string>;

  /**
   * Per-named-capture-group styles. When set, one MarkDecoration is emitted
   * per named group instead of one for the whole match. The 'd' flag
   * (indices) is added to the pattern automatically.
   * Unmatched optional groups are silently skipped.
   */
  captureGroups?: Record<string, MarkDecorationStyle>;

  // Callback to generate a LineDecoration for matching lines
  createLineDecoration?: (match: RegExpMatchArray) =>
    | Omit<LineDecoration, 'id' | 'type' | 'line'>
    | null;
}

/** Subset of MarkDecoration properties used for styling (no id / from / to). */
type MarkDecorationStyle = Pick<MarkDecoration,
  'className' | 'bold' | 'italic' | 'color' | 'background' |
  'underline' | 'underlineColor' | 'attributes'
>;
```

### Example: Simple Pattern

```ts
// Red wavy underline for "FIXME"
editor.addPattern({
  pattern: /\bFIXME\b/g,
  color: '#f38ba8',
  underline: 'wavy',
  underlineColor: '#f38ba8',
});
```

### Example: Pattern with Error-Lens Annotation

```ts
 editor.addPattern({
  pattern: /\bFIXME\b/g,
  bold: true,
  color: '#f38ba8',
  underline: 'wavy',
  createLineDecoration: (match) => ({
    className: 'fixme-line',
    message: 'Review before release',
    messageClassName: 'fixme-message',
  }),
});
```

Then style the message:

```ts
api.adoptStyleSheet(`
  .v2-line[data-message-class~="fixme-message"]::after {
    color: #f38ba8;
    font-weight: bold;
  }
`);
```

### Example: Multi-line Regex (JavaScript comments)

```ts
editor.addPattern({
  pattern: /\/\*[\s\S]*?\*\//g,
  italic: true,
  color: '#6c7086',
  createLineDecoration: () => ({
    message: '(comment)',
    messageClassName: 'comment-marker',
  }),
});
```

### Example: Named Capture Groups (`captureGroups`)

Use `captureGroups` to style different parts of a match independently without
manual offset arithmetic. One `MarkDecoration` is emitted per named group;
unmatched optional groups are skipped.

```ts
// key: value lines — key in purple, value in green
editor.addPattern({
  pattern: /^(?<key>\w[\w-]*):\s*(?<value>.+)$/gm,
  captureGroups: {
    key:   { bold: true, color: '#c792ea' },
    value: { color: '#c3e88d' },
  },
});
```

```ts
// Ingredient lines — quantity/measure bold, prep text muted
editor.addPattern({
  pattern: /^(?<qty>[\d\s\/\u215B-\u215E]+\s+\w+)\s+(?<name>[^,]+?)(?<prep>,\s+.+)?$/gm,
  captureGroups: {
    qty:  { bold: true },
    name: { bold: true, color: 'var(--color-primary)' },
    prep: { italic: true, color: 'var(--color-text-muted)' },
  },
});
```

---

## Plugin Helpers

Two utilities are exported from the package to reduce plugin boilerplate.

### `matchPatternResults(value, patterns)`

Run a `TextPattern` array against `value` and return all matches as
decoration objects — without registering the patterns on the editor element.
Useful when a plugin needs to combine pattern-matched decorations with custom
decorations in a single `api.setDecorations()` call.

```ts
import { matchPatternResults } from '@rcarls/rc-textarea';

const KEYWORD_PATTERNS = [
  { id: 'kw-function', pattern: /\bfunction\b/g, bold: true, color: '#c792ea' },
  { id: 'kw-return',   pattern: /\breturn\b/g,   bold: true, color: '#89ddff' },
];

editor.usePlugin({
  update(value, api) {
    const { markDecorations, lineDecorations } =
      matchPatternResults(value, KEYWORD_PATTERNS);

    // Merge with custom diagnostics from a parser
    const diagnostics = myParser.lint(value);

    api.setDecorations([
      ...markDecorations,
      ...lineDecorations,
      ...diagnostics,
    ]);
  },
});
```

### `createLineDecoratorPlugin(decorator, options?)`

Factory that wraps a `LineDecoratorPlugin` in a full `RCTextareaPlugin`. It handles:

- CSS injection via `api.adoptStyleSheet` on `mount()`
- `lineStart` offset bookkeeping — `decorateLine()` works with **line-relative** offsets (0 = start of the line), not absolute document offsets
- Optional `watch` subscriptions that call `api.scheduleUpdate()` when external values change (framework-agnostic)
- Cleanup of subscribers on `destroy()`

```ts
import { createLineDecoratorPlugin } from '@rcarls/rc-textarea';
import type { LineDecoratorPlugin } from '@rcarls/rc-textarea';

const KEYWORD_CSS = '.kw { font-weight: bold; color: #c792ea; }';

const keywordDecorator: LineDecoratorPlugin = {
  styles: KEYWORD_CSS,
  decorateLine(line) {
    const results = [];
    for (const m of line.matchAll(/\bfunction\b/g)) {
      results.push({
        type: 'mark' as const,
        from: m.index!,
        to: m.index! + m[0].length,
        className: 'kw',
      });
    }
    return results;
  },
};

editor.usePlugin(createLineDecoratorPlugin(keywordDecorator));
```

#### With `extraDecorations` (merging whole-document results)

```ts
editor.usePlugin(createLineDecoratorPlugin(
  myLineDecorator,
  {
    extraDecorations: (value) => {
      // e.g. whole-document diagnostics from a parser
      return myParser.lint(value).map(d => ({
        type: 'line' as const,
        line: d.line,
        message: d.message,
        messageClassName: 'diagnostic-error',
      }));
    },
  },
));
```

#### With `watch` (react to external signal changes)

`watch` is an array of subscriber setup functions — each receives an `onChange`
callback and may return an optional cleanup function. This is
intentionally framework-agnostic.

```ts
// Vanilla JS: subscribe to a custom event
editor.usePlugin(createLineDecoratorPlugin(
  myDecorator,
  {
    watch: [
      (onChange) => {
        window.addEventListener('theme-change', onChange);
        return () => window.removeEventListener('theme-change', onChange);
      },
    ],
  },
));

// Solid.js: pass reactive signals
import { createEffect, on } from 'solid-js';

editor.usePlugin(createLineDecoratorPlugin(
  myDecorator,
  {
    watch: [
      (cb) => createEffect(on(mySignal, cb, { defer: true })),
    ],
  },
));
```

---

## Selection API

The component tracks the current selection as plain-text offsets (not DOM nodes or ranges).

### Getting Selection

```ts
interface RCTextareaPluginAPI {
  readonly selectionStart: number;
  readonly selectionEnd: number;
  
  getCursorRect(): DOMRect | null;
  getWordAtCursor(): { word: string; from: number; to: number } | null;
  onCursorMove(callback: (start: number, end: number) => void): () => void;
}
```

### Example: Tracking Cursor Moves

```ts
let unsub: () => void;

editor.usePlugin({
  mount(api) {
    unsub = api.onCursorMove((start, end) => {
      if (start === end) {
        // Cursor is collapsed (no selection)
        const word = api.getWordAtCursor();
        if (word) {
          console.log(`Cursor on word: "${word.word}" at ${word.from}–${word.to}`);
        }
      } else {
        // Selection active
        console.log(`Selection: ${start}–${end}`);
      }
    });
  },
  destroy() {
    unsub?.();
  },
});
```

### Example: Anchoring Autocomplete Popup

```ts
editor.usePlugin({
  mount(api) {
    const unsub = api.onCursorMove(() => {
      const rect = api.getCursorRect();
      if (rect) {
        const popup = document.querySelector('#autocomplete');
        popup.style.left = rect.left + 'px';
        popup.style.top = (rect.top + rect.height) + 'px';
      }
    });
    return () => unsub?.();
  },
});
```

---

## Decoration Lifecycle

Decorations undergo transformation as the text changes:

### Mapping Decorations Through Changes

When text is edited, existing plugin decorations are automatically adjusted:

- **Before the edit region**: start/end offsets unchanged
- **After the edit region**: start/end offsets shifted by the character delta
- **Overlapping the edit region**: start/end clamped to edit boundaries
- **Zero-width after clamping**: decoration is dropped

### Large Change Heuristic

If a change is detected as **"large"** (heuristic: `changeSize > 50 chars AND changeSize > 50% of document`), all plugin decorations are cleared to avoid mapping errors. This handles:

- Paste of large text blocks
- Select-all + type
- Programmatic `value` set with very different content

Pattern decorations are **always** fully recomputed on each change (regex is re-run).

### Architecture Note for Agents

Decoration mapping occurs in `mapDecorationsThroughChange()` (in `decoration.ts`). The function:
1. Calls `findEdit()` to locate insertion/deletion boundaries
2. Applies geometry transformation to each decoration
3. Returns a new decoration map (old map is not mutated)

---

## Undo / Redo

The component maintains its own undo/redo stack because DOM rebuilds (which happen on every render frame) invalidate the browser's native contenteditable undo history.

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+Z` / `Cmd+Z` | Undo |
| `Ctrl+Y` / `Cmd+Y` / `Ctrl+Shift+Z` | Redo |

### Stack Details

- **Capacity**: 100 entries (MAX_UNDO)
- **Stored per entry**: plain text value + cursor position (anchorOffset, focusOffset)
- **Decorations**: not stored; recomputed from the restored value
- **Granularity**: one entry per input event (or scheduled update)

### Architecture

The undo stack is stored in:
```ts
private _undoStack: UndoEntry[] = [];
private _undoIndex = -1;  // Current position in stack
```

Each entry is created when text changes via input event. The stack is pruned to MAX_UNDO when full.

---

## Keyboard Behavior

| Key | Behavior |
|-----|----------|
| `Tab` | Insert `\t` character (does not move focus) |
| `Ctrl/Cmd+Z` | Undo |
| `Ctrl/Cmd+Y` / `Ctrl/Cmd+Shift+Z` | Redo |
| `Paste` | HTML/rich text is stripped; only plain text is inserted |
| `Enter` | Insert line break (`\n`) |

### Paste Handling

The component uses `input` event to detect and normalize pasted content. HTML markup is discarded; only plain text characters are inserted.

---

## Form Integration

The slotted `<textarea>` participates in form submission normally:

1. **Hidden visually** — inline styles: `position: absolute; left: -9999px; opacity: 0; clip: rect(0 0 0 0)`
2. **DOM remains** — slotted at the light DOM so form traversal finds it
3. **Value synced** — component keeps textarea's value in sync with `this._value`
4. **Attributes adopted** — `name`, `required`, `disabled`, `maxlength`, `placeholder` are read from textarea on mount
5. **Submission** — form submission reads textarea's value directly

### Example

```html
<form id="myform">
  <rc-textarea>
    <textarea 
      name="body" 
      required 
      maxlength="5000"
      placeholder="Enter your message…"
    ></textarea>
  </rc-textarea>
  <button type="submit">Send</button>
</form>
```

```ts
document.getElementById('myform').addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  console.log(formData.get('body'));  // Plain text value
});
```

---

## Accessibility

The component is designed with accessibility in mind:

### ARIA Roles & Attributes

- **`role="textbox"`** — identifies the editor as a text input
- **`aria-multiline="true"`** — indicates multiline text support
- **`aria-label`** — set via the `label` attribute (optional)
- **`delegatesFocus=true`** — shadow DOM focus is delegated to the editable region

### Keyboard Navigation

- Tab and Shift+Tab focus/blur the editor normally
- Arrow keys, Home/End, Ctrl+Arrow, etc. work natively
- Screen readers can read selected text and cursor position

### Visual Accessibility

- High contrast by default (system colors)
- `:focus-visible` indicator (can be styled via CSS custom property)
- Line numbers are `aria-hidden="true"` (not part of screen reader navigation)

### Spellcheck Disabled

Spell checking is disabled to prevent vendor-specific squiggles from interfering with custom decorations. Set explicitly in the editor:

```ts
editor.spellcheck = false;
editor.autocorrect = 'off';
editor.autocapitalize = 'off';
```

---

## Performance Considerations

### DOM Rebuild on Every Render

The blot tree is **completely rebuilt** on each render frame (RAF-batched). This is necessary because:
- Decoration changes require DOM restructuring
- Plain-text ↔ DOM offset conversion requires a stable tree
- Cursor restoration requires rebuilding after changes

For documents **< 10,000 characters**, this is imperceptible. For very large documents, consider:
- Truncating visible content (virtual scrolling)
- Debouncing plugin updates
- Using pattern decorations instead of plugin updates (patterns are optimized)

### Decoration Density

Large numbers of overlapping decorations (e.g., 1000+ marks on a single line) will impact performance. Keep decoration counts reasonable:
- Syntax highlighting: typically 10–100 marks per line
- Error markers: typically 1–5 per line
- Patterns: typically < 50 matches per line

If density is high, profile with DevTools to identify bottlenecks.

### Memory

The undo/redo stack stores 100 entries of `{ value, anchorOffset, focusOffset }`. For a 10 KB document, this is ~1 MB. For very large documents, consider limiting undo depth or using an external undo manager.

---

## Troubleshooting

### Selection is lost after edit

Normal behavior — selection is saved before render and restored after. If you're updating text and immediately reading `selectionStart`, use `onCursorMove()` or `setTimeout()` to wait for the next render frame.

```ts
editor.value = 'new text';
// DON'T do this:
console.log(editor.selectionStart);  // May be stale

// DO this:
await editor.updateComplete;
const start = editor.value === 'new text' ? api.selectionStart : null;
```

### Decorations disappear after large paste

If you paste a large block of text (> 50 chars and > 50% of document), plugin decorations are cleared by the "large change heuristic" to avoid mapping errors. Pattern decorations are reapplied. To preserve plugin decorations, update them in the plugin's `update()` method:

```ts
editor.usePlugin({
  update(value, api) {
    // Recompute decorations from the new value
    const decs = parseText(value);
    api.setDecorations(decs);
  },
});
```

### Other's DOM change events fire inside editor

The component does not suppress mutation events on the editor. If you're listening for `MutationObserver` events on the editor element, you'll observe all blot tree rebuilds. To avoid this, listen outside the editor or throttle updates.

### cursor doesn't stay at expected position

Cursor restoration uses plain-text offsets. If decorations change (especially widgets, which take up no space in the value), the visual cursor position may shift. This is expected. Use `getCursorRect()` to anchor UI elements if precise positioning is critical.

### Text is very long (> 100 KB), editor is slow

The entire blot tree is rebuilt on each character input. For very large documents:
- Profile with DevTools Performance tab to identify bottleneck
- Consider truncating visible content (virtual scrolling)
- Use `word-wrap: false` to reduce line breaks (fewer blots)
- Limit undo depth: only keep last 10 entries instead of 100

### Plugin's `highlight()` result is overwritten immediately

If both `update()` and `highlight()` are provided, only one runs per render. The component runs `highlight()` if it returns a truthy value; otherwise, `update()` is called.

---

## API Reference Summary

### Properties

| Property | Type | Default | Reflects |
|----------|------|---------|----------|
| `value` | `string` | `''` | N/A |
| `lineNumbers` | `boolean` | `false` | Yes (*line-numbers* attr) |
| `listNumbers` | `boolean` | `false` | Yes (*list-numbers* attr) |
| `gutter` | `boolean` | `false` | Yes (*gutter* attr) |
| `wordWrap` | `boolean` | `false` | Yes (*word-wrap* attr) |
| `autoGrow` | `boolean` | `false` | Yes (*auto-grow* attr) |
| `readOnly` | `boolean` | `false` | Yes (*read-only* attr) |
| `label` | `string \| null` | `null` | No |
| `selectionStart` | `number` | `0` | No (readonly) |
| `selectionEnd` | `number` | `0` | No (readonly) |

### Methods

| Method | Signature | Returns |
|--------|-----------|---------|
| `usePlugin()` | `(plugin: RCTextareaPlugin) => void` | — |
| `removePlugin()` | `() => void` | — |
| `addPattern()` | `(pattern: Omit<TextPattern, 'id'>) => string` | Pattern ID |
| `removePattern()` | `(id: string) => void` | — |
| `clearPatterns()` | `() => void` | — |

### Exported Helpers

| Export | Kind | Description |
| ------ | ---- | ----------- |
| `matchPatternResults` | function | Run `TextPattern[]` against a string; returns `{ markDecorations, lineDecorations }` |
| `createLineDecoratorPlugin` | function | Wrap a `LineDecoratorPlugin` in a full `RCTextareaPlugin` |
| `MarkDecorationStyle` | type | Styling-only subset of `MarkDecoration` (used in `TextPattern.captureGroups`) |
| `LineDecoratorPlugin` | interface | Per-line decorator with line-relative offsets |
| `LineDecoratorPluginOptions` | interface | Options for `createLineDecoratorPlugin` |

### Events

| Event | Bubbles | Composed | Detail |
|-------|---------|----------|--------|
| `rc-textarea-change` | Yes | Yes | `{ value: string }` |
| `rc-textarea-focus` | Yes | Yes | — |
| `rc-textarea-blur` | Yes | Yes | — |
| `rc-textarea-select` | Yes | Yes | `{ selectionStart: number, selectionEnd: number }` |

### CSS Custom Properties

All custom properties are listed in [CSS Customization](#css-customization).

### CSS Parts

All parts are listed in [CSS Customization](#css-customization).

---

## Support & Contributing

For issues, feature requests, or contributions, visit the [rc-webcomponents repository](https://github.com/richardcarls/rc-webcomponents).

---

## License

[MIT](LICENSE) © Richard Carls
