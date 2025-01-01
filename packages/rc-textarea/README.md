# rc-textarea

A WAI-ARIA compliant textarea enhancement web component built with [Lit 3](https://lit.dev). Wraps a native `<textarea>` with a mirror overlay that enables:

- **Line numbers** with correct alignment in word-wrap mode
- **Word wrap** (toggleable)
- **Auto-grow** (expands to content height)
- **Range decorations** — mark spans and whole-line highlights
- **Error Lens-style inline diagnostics** — severity-colored inline messages with optional icons and wavy underlines
- **Regex pattern matching** — auto-generate decorations and diagnostics from text
- **Plugin API** — replace the entire rendering pipeline for syntax highlighting (sync or async)
- **Full ARIA** — live diagnostic announcements, `aria-invalid`, `aria-describedby`

The native `<textarea>` remains the interaction surface. All decorations live in a sibling mirror div behind it.

---

## Installation

```bash
npm install @rcarls/rc-textarea
# or
yarn add @rcarls/rc-textarea
```

The package is an ES module. Import to auto-register the custom element:

```ts
import '@rcarls/rc-textarea';
```

Or import the class for typed access:

```ts
import { RCTextarea } from '@rcarls/rc-textarea';
```

---

## Basic Usage

Always slot a native `<textarea>` as the direct child:

```html
<rc-textarea>
  <textarea name="body" rows="10"></textarea>
</rc-textarea>
```

The component reads `rows` and `cols` attributes from the slotted textarea to set its initial size. In `autogrow` mode, `rows` sets a `min-height` so the component starts at that size and grows with content.

---

## Attributes / Properties

All boolean attributes reflect as properties with the same camelCase name.

| Attribute | Property | Type | Default | Description |
|-----------|----------|------|---------|-------------|
| `line-numbers` | `lineNumbers` | `boolean` | `false` | Show line number gutter |
| `word-wrap` | `wordWrap` | `boolean` | `false` | Enable word wrap |
| `autogrow` | `autoGrow` | `boolean` | `false` | Grow to fit content |
| `read-only` | `readOnly` | `boolean` | `false` | Make textarea read-only |
| `label` | `label` | `string` | `''` | Sets `aria-label` on textarea if not already set |

```html
<rc-textarea line-numbers word-wrap autogrow>
  <textarea rows="5"></textarea>
</rc-textarea>
```

---

## CSS Custom Properties

Set these on the host element or any ancestor.

| Property | Default | Description |
|----------|---------|-------------|
| `--rc-textarea-font-family` | `monospace` | Font family |
| `--rc-textarea-font-size` | `1em` | Font size |
| `--rc-textarea-line-height` | `1.5` | Line height |
| `--rc-textarea-padding` | `0.5em` | Inner padding |
| `--rc-textarea-background` | `Field` | Background color |
| `--rc-textarea-color` | `FieldText` | Text color |
| `--rc-textarea-caret-color` | `var(--rc-textarea-color)` | Caret color — **must not be `transparent`** |
| `--rc-textarea-border` | `1px solid ButtonBorder` | Border |
| `--rc-textarea-border-radius` | `2px` | Border radius |
| `--rc-textarea-focus-outline` | `2px solid AccentColor` | Focus ring |
| `--rc-textarea-gutter-color` | `GrayText` | Line number text color |
| `--rc-textarea-gutter-bg` | `Canvas` | Line number gutter background |
| `--rc-textarea-gutter-border` | `ButtonBorder` | Gutter right border color |
| `--rc-textarea-mark-error-color` | `#e06c75` | Wavy underline color for errors |
| `--rc-textarea-mark-warning-color` | `#e5c07b` | Wavy underline color for warnings |
| `--rc-textarea-mark-info-color` | `#61afef` | Wavy underline color for info |
| `--rc-textarea-mark-hint-color` | `#98c379` | Wavy underline color for hints |

---

## CSS Parts

Style internal parts from outside the component with `::part()`:

| Part | Element |
|------|---------|
| `root` | Outer flex container |
| `gutter` | Line number gutter |
| `line-numbers` | Line number elements container |
| `editor-area` | Editor area (mirror + textarea side by side) |
| `mirror` | The decoration mirror div |
| `diagnostic-status` | ARIA live region for diagnostic announcements |

```css
rc-textarea::part(mirror) { border-radius: 6px; }
rc-textarea::part(gutter) { font-size: 0.8em; }
```

---

## Events

All events bubble and are composed (cross shadow boundary).

| Event | Detail type | Fires when |
|-------|-------------|------------|
| `rc-textarea-change` | `{ value: string }` | User inputs text |
| `rc-textarea-focus` | `void` | Textarea receives focus |
| `rc-textarea-blur` | `void` | Textarea loses focus |
| `rc-textarea-select` | `{ selectionStart: number, selectionEnd: number }` | Text selection changes |

```ts
const el = document.querySelector('rc-textarea');
el.addEventListener('rc-textarea-change', (e) => {
  console.log(e.detail.value);
});
```

---

## Value API

```ts
const el = document.querySelector('rc-textarea');

// Read current value
console.log(el.value);

// Set value programmatically (remaps existing decorations through the change)
el.value = 'new content';
```

---

## Diagnostic API

Diagnostics render as Error Lens-style inline messages after the line text, with optional wavy underlines and ARIA announcements.

```ts
import type { Diagnostic } from '@rcarls/rc-textarea';
```

### `Diagnostic` type

```ts
interface Diagnostic {
  id: string;                        // Auto-generated — omit when calling API methods
  line: number;                      // 1-based logical line number
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  createIcon?: () => HTMLElement;    // Optional leading icon factory (e.g. SVG element)
  range?: TextRange;                 // { from: number, to: number } — character offsets for wavy underline
  markClassName?: string;            // Defaults to "diagnostic-mark diagnostic-mark--{severity}"
  lineClassName?: string;            // Added to the .line div, e.g. "diagnostic-line--error"
}
```

### Methods

```ts
// Replace all diagnostics at once (most common usage)
el.setDiagnostics([
  { line: 2, severity: 'error', message: 'Unexpected token' },
  { line: 4, severity: 'warning', message: 'Unused variable', range: { from: 42, to: 49 } },
]);

// Add a single diagnostic, returns its id
const id = el.addDiagnostic({ line: 1, severity: 'info', message: 'Tip: use shorthand' });

// Remove by id
el.removeDiagnostic(id);

// Clear all
el.clearDiagnostics();
```

The component automatically sets `aria-invalid="true"` on the slotted textarea when any error-severity diagnostic is present, and clears it when none remain.

---

## Pattern API

Patterns apply decorations (and optionally generate diagnostics) based on regular expression matches, without any external event handling.

```ts
import type { TextPattern } from '@rcarls/rc-textarea';
```

```ts
// Highlight URLs in green
el.addPattern({
  pattern: /https?:\/\/\S+/g,
  className: 'token-url',
  cssText: '.token-url { color: var(--demo-url, #22863a); }',
});

// Highlight numbers and produce a warning diagnostic for values > 100
const numPatternId = el.addPattern({
  pattern: /\b\d+\b/g,
  className: 'token-num',
  createDiagnostic: (match) => {
    if (Number(match[0]) > 100) {
      return { severity: 'warning', message: `Value ${match[0]} exceeds limit` };
    }
    return null;
  },
});

// Remove a pattern
el.removePattern(numPatternId);

// Remove all patterns
el.clearPatterns();
```

---

## Plugin API

Plugins replace the mirror rendering pipeline entirely. Return an HTML string from `highlight()` to take full control, or return `null`/`undefined` to fall through to the standard pipeline.

```ts
import type { RCTextareaPlugin, RCTextareaPluginAPI } from '@rcarls/rc-textarea';
```

### `RCTextareaPlugin` interface

```ts
interface RCTextareaPlugin {
  mount?(api: RCTextareaPluginAPI): void;   // Called when plugin is registered
  destroy?(): void;                          // Called on removePlugin() or disconnect
  highlight(
    value: string,
    api: RCTextareaPluginAPI,
  ): string | null | undefined | void | Promise<string | null | undefined | void>;
}
```

### `RCTextareaPluginAPI` interface

```ts
interface RCTextareaPluginAPI {
  readonly host: RCTextarea;
  readonly mirror: HTMLDivElement;
  readonly diagnostics: ReadonlyArray<Diagnostic>;
  readonly decorations: ReadonlyArray<Decoration>;
  escapeHtml(text: string): string;
  renderDefault(value: string): string;
  scheduleUpdate(): void;
}
```

### Example — synchronous syntax highlighter

```ts
const myPlugin: RCTextareaPlugin = {
  highlight(value, api) {
    // Build mirror HTML — must use api.escapeHtml() for raw text
    const lines = value.split('\n').map((line) => {
      const escaped = api.escapeHtml(line);
      // … apply syntax spans …
      return `<div class="line">${escaped}</div>`;
    });
    return lines.join('');
  },
};

el.usePlugin(myPlugin);
// Later:
el.removePlugin();
```

### Example — async highlighter (Web Worker / wasm)

```ts
const asyncPlugin: RCTextareaPlugin = {
  async highlight(value, api) {
    const html = await myWorker.highlight(value);
    // Stale results are automatically discarded if a newer render started
    return html;
  },
};
```

### Important: diagnostics from within `highlight()`

Calling `api.host.setDiagnostics()` from inside `highlight()` is safe — the component ignores the re-render request that would otherwise be queued (via the `_isRendering` guard) and instead applies the updated diagnostics on the **next** render cycle. However, it is simpler and more correct to call `setDiagnostics` from the `rc-textarea-change` event handler:

```ts
el.addEventListener('rc-textarea-change', ({ detail: { value } }) => {
  const diagnostics = myParser.lint(value);
  el.setDiagnostics(diagnostics);
});
```

### Preserving `.line` structure in plugin output

The component appends inline diagnostic messages to elements matching `.line` in the mirror. If your plugin output uses `<div class="line">…</div>` wrappers (one per logical line), diagnostics added via `setDiagnostics` will appear inline. If your plugin uses a different structure, diagnostics are still announced via ARIA but not rendered visually.

Use `api.renderDefault(value)` as a base if you want the standard line structure with all decorations, then post-process it:

```ts
highlight(value, api) {
  const base = api.renderDefault(value);
  // e.g. wrap tokens from a tokenizer on top of the default output
  return applyTokens(base, tokenize(value));
}
```

---

## Stylesheet Injection

Light-DOM stylesheets do not pierce the shadow boundary. Use these methods to inject decoration CSS:

```ts
// Inject raw CSS text (simplest — creates a CSSStyleSheet internally)
el.setDecorationStyles(`
  .kw { color: #c678dd; font-weight: bold; }
  .str { color: #98c379; }
`);

// Adopt an existing CSSStyleSheet (e.g. from highlight.js or a theme)
el.adoptStyleSheet(myThemeSheet);

// Remove it (e.g. when switching themes)
el.removeStyleSheet(myThemeSheet);
```

---

## Navigation

```ts
// Scroll editor so line 42 is visible (1-based)
el.revealLine(42);
```

---

## SolidJS Integration Guide

SolidJS's JSX treats `value={...}` on a `<textarea>` as a reactive binding that re-sets `.value` whenever the signal changes. This conflicts with how `rc-textarea` reads the textarea value. Follow these patterns to avoid all four common issues.

### 1 — Use imperative initial value, not a reactive binding

```tsx
import { onMount, onCleanup } from 'solid-js';

function MyField(props: { defaultValue?: string }) {
  let rcEl!: RCTextarea;
  let taRef!: HTMLTextAreaElement;

  // Capture initial value non-reactively (runs once at component creation time)
  const initialValue = props.defaultValue ?? '';

  onMount(() => {
    // Set value imperatively — rc-textarea reads it in a microtask after onMount
    taRef.value = initialValue;

    rcEl.usePlugin(myPlugin);
    onCleanup(() => rcEl.removePlugin());
  });

  return (
    <rc-textarea ref={rcEl} autogrow>
      {/* Do NOT use value={...} — use ref + imperative assignment */}
      <textarea ref={taRef} name="body" rows="5" />
    </rc-textarea>
  );
}
```

**Why:** `value={expr}` creates a reactive effect that calls `textarea.value = expr` every time the signal updates (e.g. after a refetch). This overwrites in-progress user edits. `rc-textarea` reads `textarea.value` during the `slotchange` microtask, so setting it in `onMount` is safe.

### 2 — Protect against global textarea resets

If your app has a global stylesheet rule like `textarea { background-color: var(--form-control-bg); color: var(--text) }`, it will win over the component's `::slotted(textarea)` rules at equal specificity — making the textarea opaque and hiding the mirror.

The component now uses `!important` on `color: transparent` and `background: transparent`, which protects against this in most cases. As a belt-and-suspenders fallback, you can also add inline styles to the slotted textarea:

```tsx
<textarea
  ref={taRef}
  name="body"
  rows="5"
  style="color: transparent; background-color: transparent;"
/>
```

Inline styles always win over author stylesheet rules.

### 3 — Minimum height with autogrow

When using `autogrow`, set `rows` on the slotted textarea to establish a minimum height. The component converts this to `min-height` on the host so the component starts at that size and grows with content:

```html
<rc-textarea autogrow>
  <textarea rows="5"></textarea>
</rc-textarea>
```

Alternatively, set `min-height` on the host element directly:

```tsx
<rc-textarea autogrow style="min-height: calc(5 * 1.5rem)">
  <textarea />
</rc-textarea>
```

### 4 — Call setDiagnostics from the change event

```tsx
onMount(() => {
  rcEl.usePlugin(myPlugin);

  // Run initial lint
  if (initialValue) {
    rcEl.setDiagnostics(lint(initialValue));
  }

  onCleanup(() => rcEl.removePlugin());
});

// Re-lint on every change
rcEl.addEventListener('rc-textarea-change', ({ detail: { value } }) => {
  rcEl.setDiagnostics(lint(value));
});
```

Do **not** call `setDiagnostics` from inside `plugin.highlight()` — even though the render loop is now guarded, calling it there makes the highlight function responsible for state management, which is confusing and error-prone.

---

## Common Pitfalls

### Global textarea CSS resets

Any author stylesheet rule that sets `color` or `background` on bare `textarea` elements will compete with the shadow `::slotted(textarea)` rules. The component defends against this with `!important`. If you observe the mirror being hidden, add `style="color:transparent;background-color:transparent"` to the slotted textarea.

### Plugin output must escape user text

Never place raw textarea content directly into mirror HTML. Always use `api.escapeHtml()`:

```ts
// Wrong — XSS risk
return `<div class="line">${line}</div>`;

// Correct
return `<div class="line">${api.escapeHtml(line)}</div>`;
```

### One plugin at a time

`usePlugin` replaces any existing plugin (calling `destroy()` on the old one). There is no support for composing multiple plugins; combine their logic into one plugin instead.

### `rows`/`cols` are read once at slot time

Size adoption from `rows`/`cols` happens when the textarea is first slotted. Changing the `rows` attribute later has no effect on the host element's size. Set dimensions on the host element directly if you need to update them dynamically.

### Decoration API is internal

The `addDecoration` / `removeDecoration` / `updateDecoration` / `clearDecorations` / `setDecorations` methods are `protected` and intended for internal subsystems. Use the `Diagnostic API` or `Pattern API` for external consumers, or the `Plugin API` for full rendering control.
