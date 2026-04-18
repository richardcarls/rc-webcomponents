<script setup>
import { ref, onMounted } from 'vue';

const alLine = ref('–');
const alCol = ref('–');
const alSel = ref('0–0');
const alChars = ref('collapsed');

// Multi-line textarea defaults — stored as JS strings to prevent blank
// lines inside <textarea> from terminating VitePress HTML blocks early.
const taContents = {
  basic: [
    'Lorem ipsum dolor sit amet consectetur adipisicing elit.',
    'Nemo quaerat exercitationem, voluptatum inventore impedit.',
    '',
    'Lorem ipsum dolor sit amet.',
    '',
    'Lorem ipsum dolor sit amet consectetur adipisicing elit. Corrupti, totam.',
  ].join('\n'),
  active: [
    'Move the cursor around to see the active line highlight.',
    'Use Shift+Arrow to extend the selection.',
    '',
    'Blank lines are fully editable.',
    '',
    'End of section.',
  ].join('\n'),
  list: [
    'Install the dependencies with your package manager.',
    '',
    'Copy the example configuration file to your project root.',
    '',
    'Open the config and set your API key and base URL.',
    '',
    'Run the development server.',
    '',
    'Open localhost:5173 in your browser.',
  ].join('\n'),
  pattern: [
    'function processData(input) {',
    '  // TODO: validate input before processing',
    '  const result = transform(input);',
    '  // FIXME: breaks when input is null',
    '  if (!result) HACK_return_default();',
    '  return result;',
    '}',
  ].join('\n'),
  wrap: 'This is a very long line that demonstrates word-wrap and auto-grow working together. The editor expands as you type, and long lines wrap at the container boundary instead of producing a horizontal scrollbar.',
};

onMounted(() => {
  // Set textarea default values after mount.
  const ids = {
    'basic-ta': taContents.basic,
    'active-ta': taContents.active,
    'list-ta': taContents.list,
    'pattern-ta': taContents.pattern,
    'wrap-ta': taContents.wrap,
  };
  for (const [id, val] of Object.entries(ids)) {
    const el = document.getElementById(id);
    if (el) el.defaultValue = val;
  }

  // Active line + cursor state plugin
  const activeDemo = document.getElementById('active-demo');
  if (activeDemo) {
    let unsub;
    activeDemo.usePlugin({
      mount(api) {
        unsub = api.onCursorMove((start, end) => {
          const before = api.value.slice(0, start);
          const ln = before.split('\n').length;
          const col = before.length - before.lastIndexOf('\n');
          alLine.value = ln;
          alCol.value = col;
          alSel.value = `${start}–${end}`;
          alChars.value = start === end ? 'collapsed' : `${end - start} chars`;
        });
      },
      destroy() { unsub?.(); },
    });
  }

  // Pattern matching
  const patternDemo = document.getElementById('pattern-demo');
  if (patternDemo) {
    patternDemo.addPattern({ pattern: /\bTODO\b/g,  bold: true, color: '#fab387', background: 'rgba(250,179,135,.15)' });
    patternDemo.addPattern({ pattern: /\bFIXME\b/g, bold: true, color: '#f38ba8', background: 'rgba(243,139,168,.15)' });
    patternDemo.addPattern({ pattern: /\bHACK\b/g,  bold: true, color: '#f9e2af', background: 'rgba(249,226,175,.15)' });
  }
});
</script>

# rc-textarea

An enhanced textarea with line decorations, a gutter, and a plugin API. Wraps a native `<textarea>` — form association, labels, and pre-upgrade usability work without JavaScript.

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

## Styling

`rc-textarea` exposes CSS custom properties for theming. All properties are optional.

```css
rc-textarea {
  display: block;
  --rc-textarea-font-family: 'Cascadia Code', monospace;
  --rc-textarea-font-size: 13.5px;
  --rc-textarea-line-height: 1.65;
  --rc-textarea-background: #1e1e2e;
  --rc-textarea-color: #cdd6f4;
  --rc-textarea-border: 1px solid #45475a;
  --rc-textarea-border-radius: 6px;
  --rc-textarea-padding: 0.75em 1em;
  --rc-textarea-focus-outline: 2px solid #89b4fa;
  --rc-textarea-gutter-bg: #11111b;
  --rc-textarea-gutter-color: #6c7086;
  --rc-textarea-caret-color: #f5c2e7;
  --rc-textarea-active-line-bg: rgba(137, 180, 250, 0.055);
}
```

## Basic (unstyled)

No theme or styling applied — line numbers via the `line-numbers` attribute, word wrap via `word-wrap`.

<ClientOnly>
<div class="demo-section">
  <rc-textarea line-numbers word-wrap>
    <textarea id="basic-ta" rows="6"></textarea>
  </rc-textarea>
</div>
</ClientOnly>

```html
<rc-textarea line-numbers word-wrap>
  <textarea rows="6">Content here.</textarea>
</rc-textarea>
```

## Active line + cursor state

The `onCursorMove` plugin API tracks cursor position in real time. `--rc-textarea-active-line-bg` highlights the current line.

<ClientOnly>
<div class="demo-section">
  <rc-textarea id="active-demo" line-numbers>
    <textarea id="active-ta" name="active" rows="7"></textarea>
  </rc-textarea>
  <div style="display:flex;gap:1.25rem;padding:0.3rem 0.85rem;font-family:monospace;font-size:0.72rem;color:var(--vp-c-text-2);background:var(--vp-c-bg-soft);border:1px solid var(--vp-c-divider);border-top:none;border-radius:0 0 6px 6px;">
    <span>Ln <b>{{ alLine }}</b>, Col <b>{{ alCol }}</b></span>
    <span>Sel <b>{{ alSel }}</b> ({{ alChars }})</span>
  </div>
</div>
</ClientOnly>

```js
editor.usePlugin({
  mount(api) {
    api.onCursorMove((start, end) => {
      const before = api.value.slice(0, start);
      const line = before.split('\n').length;
      const col = before.length - before.lastIndexOf('\n');
      console.log(`Ln ${line}, Col ${col}`);
    });
  },
});
```

## List-numbers gutter

`list-numbers` shows a sequential counter that increments only on non-blank lines. Blank separator lines get an empty gutter cell. Add or remove steps and watch the numbering update live.

<ClientOnly>
<div class="demo-section">
  <rc-textarea list-numbers word-wrap auto-grow>
    <textarea id="list-ta" name="list" rows="10"></textarea>
  </rc-textarea>
</div>
</ClientOnly>

```html
<rc-textarea list-numbers word-wrap auto-grow>
  <textarea>Step one. (blank lines between steps get empty gutter cells)</textarea>
</rc-textarea>
```

## Pattern matching

Regex patterns with inline mark decorations via `addPattern()`. Type `TODO`, `FIXME`, or `HACK` anywhere.

<ClientOnly>
<div class="demo-section">
  <rc-textarea id="pattern-demo" line-numbers>
    <textarea id="pattern-ta" name="pattern" rows="6" placeholder="Type TODO, FIXME, or HACK…"></textarea>
  </rc-textarea>
</div>
</ClientOnly>

```js
editor.addPattern({
  pattern: /\bTODO\b/g,
  bold: true,
  color: '#fab387',
  background: 'rgba(250,179,135,.15)',
});
editor.addPattern({ pattern: /\bFIXME\b/g, bold: true, color: '#f38ba8' });
editor.addPattern({ pattern: /\bHACK\b/g,  bold: true, color: '#f9e2af' });
```

## Word wrap + auto-grow

`word-wrap` enables soft wrapping. `auto-grow` expands the editor to fit content with no scrollbar.

<ClientOnly>
<div class="demo-section">
  <rc-textarea word-wrap auto-grow>
    <textarea id="wrap-ta" rows="3" placeholder="Long lines will wrap…"></textarea>
  </rc-textarea>
</div>
</ClientOnly>

```html
<rc-textarea word-wrap auto-grow>
  <textarea rows="3">Content here.</textarea>
</rc-textarea>
```

## Plugin API

The plugin API enables syntax highlighting, diagnostics, widget decorations, and cursor-aware tooltips. Explore the full demos in the package dev server:

```sh
yarn workspace @rcarls/rc-textarea run dev
```

```js
// Syntax highlighting via highlight.js
editor.usePlugin({
  mount(api) { api.adoptStyleSheet(hljsSheet); },
  async highlight(value, api) {
    const { value: html } = hljs.highlight(value, { language: 'javascript' });
    api.setDecorations(api.decorationsFromHtml(html));
  },
});

// Error-lens style diagnostics
editor.usePlugin({
  update(value, api) {
    api.setDecorations([
      { type: 'line', line: 3, className: 'error-line',
        message: 'Synchronous I/O blocks the event loop', messageClassName: 'error' },
      { type: 'mark', from: 42, to: 55,
        underline: 'wavy', underlineColor: '#f38ba8' },
    ]);
  },
});

// Widget decorations: inline color swatches
editor.usePlugin({
  update(_, api) {
    const decs = [];
    for (const m of api.value.matchAll(/#([0-9a-fA-F]{3,6})\b/g)) {
      decs.push({
        type: 'widget', offset: m.index, side: 'before',
        create() {
          const el = document.createElement('span');
          el.style.cssText =
            `display:inline-block;width:10px;height:10px;background:${m[0]};
             border:1px solid rgba(255,255,255,.2);border-radius:2px;
             margin-right:4px;vertical-align:middle;`;
          return el;
        },
      });
    }
    api.setDecorations(decs);
  },
});

// Cursor-aware tooltip
editor.usePlugin({
  mount(api) {
    api.onCursorMove(() => {
      const w = api.getWordAtCursor();
      const rect = api.getCursorRect();
      // position tooltip at rect.left, rect.bottom
    });
  },
});
```

## API

<ApiTable tag="rc-textarea" />
