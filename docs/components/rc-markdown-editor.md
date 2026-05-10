<script setup>
import { ref, onMounted } from 'vue';

const eventLog = ref([]);

// Textarea default values live in JS to keep Markdown markers
// (**bold**, *italic*, list items) out of the Vue template, where
// the Markdown compiler would turn them into <strong>/<em>/<ul> tags
// before Vue's template parser sees them.
const contents = {
  mainEditor: [
    '## Getting started',
    '',
    'Welcome to rc-markdown-editor.',
    '',
    'Click anywhere to place the cursor, then use the toolbar or shortcuts.',
    '',
    '- Select text and press Ctrl+B for bold',
    '- Select text and press Ctrl+I for italic',
    '- Press Ctrl+Shift+S to view the markdown source',
  ].join('\n'),
  eventsEditor:
    'Place the cursor inside bold or italic text and watch the log below.',
  controlledEditor: '# Initial content\n\nSet via the textarea initial value.',
  shortcutsEditor: [
    'Focus here and try the shortcuts.',
    '',
    'Select a phrase and press Ctrl+B to toggle bold.',
    'Or try italic with Ctrl+I.',
  ].join('\n'),
};

function logEvent(name, detail) {
  eventLog.value = [
    { name, detail: JSON.stringify(detail) },
    ...eventLog.value,
  ].slice(0, 20);
}

onMounted(() => {
  // Set textarea values after mount so the custom elements can read
  // defaultValue when they first connect.
  const taMap = {
    'main-ta': contents.mainEditor,
    'events-ta': contents.eventsEditor,
    'controlled-ta': contents.controlledEditor,
    'shortcuts-ta': contents.shortcutsEditor,
  };
  for (const [id, val] of Object.entries(taMap)) {
    const el = document.getElementById(id);
    if (el) el.defaultValue = val;
  }

  const eventsEditor = document.getElementById('events-editor');
  if (eventsEditor) {
    eventsEditor.addEventListener('rc-formatting-change', (e) =>
      logEvent('rc-formatting-change', e.detail),
    );
    eventsEditor.addEventListener('rc-mode-change', (e) =>
      logEvent('rc-mode-change', e.detail),
    );
  }

  const controlled = document.getElementById('controlled-editor');
  document.getElementById('set-value-btn')?.addEventListener('click', () => {
    if (controlled) controlled.value =
      '## New content\n\nSet via `editor.value = "…"`.';
  });
  document.getElementById('toggle-mode-btn')?.addEventListener('click', () => {
    if (controlled) controlled.sourceMode = !controlled.sourceMode;
  });
});
</script>

# rc-markdown-editor

A WYSIWYG Markdown editor. The default view renders micromark HTML in a `contenteditable` div; the Source button (or Ctrl+Shift+S) switches to the `rc-textarea` source editor. A hidden `<textarea>` in the light DOM carries the markdown value for form submission.

[WAI-ARIA Toolbar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)

<AtAGlance
  package-name="@rcarls/rc-markdown-editor"
  tag="rc-markdown-editor"
  native="Builds on rc-textarea"
  state="Controlled or uncontrolled markdown value"
  :events="['rc-formatting-change', 'rc-change', 'rc-mode-change']"
  :related="[
    { label: 'rc-textarea', href: '/components/rc-textarea' }
  ]"
/>

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

## Styling

```css
rc-markdown-editor {
  display: block;
  --rme-font-family: system-ui, sans-serif;
  --rme-font-size: 15px;
  --rme-line-height: 1.7;
  --rme-border: 1px solid ButtonBorder;
  --rme-padding: 0.75em 1em;
  --rme-focus-outline: 2px solid Highlight;
  min-height: 12rem;
}
```

<style>
rc-markdown-editor {
  display: block;
  --rme-font-family: inherit;
  --rme-font-size: 15px;
  --rme-line-height: 1.7;
  --rme-border: 1px solid var(--vp-c-divider);
  --rme-padding: 0.75em 1em;
  --rme-focus-outline: 2px solid var(--vp-c-brand-1);
  min-height: 10rem;
}
</style>

## Basic

The hidden `<textarea>` in the light DOM carries the markdown value for form submission.

<ClientOnly>
<div class="demo-section">
  <form>
    <rc-markdown-editor>
      <label for="basic-ta">Content</label>
      <textarea id="basic-ta" name="content">Edit me. Select words and use the toolbar buttons.</textarea>
    </rc-markdown-editor>
  </form>
</div>
</ClientOnly>

## Rich editor + source toggle

Click **Source** or press Ctrl+Shift+S to switch to the `rc-textarea` source editor. Toolbar buttons reflect the formatting at the cursor via `aria-pressed`.

<ClientOnly>
<div class="demo-section">
  <form>
    <rc-markdown-editor id="main-editor">
      <label for="main-ta">Post body</label>
      <textarea id="main-ta" name="body" :value="contents.mainEditor"></textarea>
    </rc-markdown-editor>
  </form>
</div>
</ClientOnly>

## Events

`rc-formatting-change` fires when the cursor moves into or out of a formatted region. `rc-mode-change` fires when the source/rich toggle switches. Both bubble and are composed.

<ClientOnly>
<div class="demo-section">
  <form>
    <rc-markdown-editor id="events-editor">
      <label for="events-ta">Content</label>
      <textarea id="events-ta" name="events-content" :value="contents.eventsEditor"></textarea>
    </rc-markdown-editor>
  </form>
  <div class="event-log" style="margin-top:0.5rem;" aria-live="polite">
    <p v-if="!eventLog.length" class="placeholder">Events will appear here…</p>
    <p v-for="entry in eventLog" :key="entry.name + entry.detail">
      <span style="color:var(--vp-c-brand-1);">{{ entry.name }}</span>
      {{ ' → ' + entry.detail }}
    </p>
  </div>
</div>
</ClientOnly>

```js
editor.addEventListener('rc-formatting-change', (e) => {
  // e.detail: { bold, italic, underline, code, … }
  console.log(e.detail);
});
editor.addEventListener('rc-mode-change', (e) => {
  // e.detail: { mode: 'rich' | 'source' }
  console.log(e.detail.mode);
});
```

## Controlled value

`editor.value = "…"` sets new markdown and re-renders. `default-source-mode` sets the initial mode to source. `editor.sourceMode = true/false` switches modes programmatically.

<ClientOnly>
<div class="demo-section">
  <form>
    <rc-markdown-editor id="controlled-editor" default-source-mode>
      <label for="controlled-ta">Notes</label>
      <textarea id="controlled-ta" name="notes" :value="contents.controlledEditor"></textarea>
    </rc-markdown-editor>
  </form>
  <div class="demo-row" style="margin-top:0.5rem;">
    <button id="set-value-btn" type="button">Set new value</button>
    <button id="toggle-mode-btn" type="button">Toggle source / rich mode</button>
  </div>
</div>
</ClientOnly>

```js
const editor = document.querySelector('rc-markdown-editor');
editor.value = '## New content\n\nSet via editor.value.';
editor.sourceMode = true;
```

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+\` | Inline code |
| Ctrl+K | Link |
| Ctrl+Shift+S | Toggle source / rich mode |

<ClientOnly>
<div class="demo-section">
  <form>
    <rc-markdown-editor>
      <label for="shortcuts-ta">Try it</label>
      <textarea id="shortcuts-ta" name="shortcuts-content" :value="contents.shortcutsEditor"></textarea>
    </rc-markdown-editor>
  </form>
</div>
</ClientOnly>

## Usage

```html
<form>
  <rc-markdown-editor>
    <label for="body">Post body</label>
    <textarea id="body" name="body">Write your markdown here.</textarea>
  </rc-markdown-editor>
</form>
```

```js
import '@rcarls/rc-markdown-editor/define';

const editor = document.querySelector('rc-markdown-editor');

// Read current markdown
console.log(editor.value);

// Set markdown programmatically
editor.value = '## Hello\n\nNew content.';

// Toggle modes
editor.sourceMode = !editor.sourceMode;

// Listen for events
editor.addEventListener('rc-formatting-change', (e) => {
  console.log(e.detail); // { bold, italic, underline, code, ... }
});
editor.addEventListener('rc-mode-change', (e) => {
  console.log(e.detail.mode); // 'rich' | 'source'
});
```

## API

<ApiTable tag="rc-markdown-editor" />
