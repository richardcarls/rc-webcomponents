<script setup>
import { ref, onMounted } from 'vue';

const basicLog = ref([]);
const createLog = ref([]);
const multiLog = ref([]);
const formOutput = ref('FormData will appear here after submit.');

onMounted(() => {
  const countryCb = document.getElementById('country-cb');
  if (countryCb) {
    countryCb.addEventListener('rc-select-change', (e) => {
      basicLog.value = [`rc-select-change → value: "${e.detail.value}"`, ...basicLog.value].slice(0, 15);
    });
  }

  const createCb = document.getElementById('create-cb');
  if (createCb) {
    createCb.addEventListener('rc-combobox-create', (e) => {
      createLog.value = [`rc-combobox-create → text: "${e.detail.text}"`, ...createLog.value].slice(0, 15);
    });
    createCb.addEventListener('rc-select-change', (e) => {
      createLog.value = [`rc-select-change → value: "${e.detail.value}"`, ...createLog.value].slice(0, 15);
    });
  }

  const multiCb = document.getElementById('multi-cb');
  if (multiCb) {
    multiCb.addEventListener('rc-select-change', (e) => {
      multiLog.value = [`rc-select-change → value: [${e.detail.value.join(', ')}]`, ...multiLog.value].slice(0, 15);
    });
  }

  const form = document.getElementById('cb-demo-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(e.target);
      const lines = [];
      for (const [key, value] of data.entries()) lines.push(`${key}: ${value}`);
      formOutput.value = lines.join('\n') || '(empty)';
    });
  }
});
</script>

# rc-combobox

An editable combobox with filtering and allow-create, backed by a native `<select>`. Supports single and multi-select with chip display. Type to filter; arrow keys navigate the popup.

[WAI-ARIA Combobox Pattern (editable)](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-combobox
```

```sh [yarn]
yarn add @rcarls/rc-combobox
```

:::

```js
import '@rcarls/rc-combobox/define';
```

<style>
rc-combobox { font-size: 1rem; }
rc-combobox::part(anchor) { min-width: 18em; }
rc-combobox::part(option) { padding: 0.35em 0.75em; }
rc-combobox::part(chip) { font-size: 0.875em; }
</style>

## Basic autocomplete

Type to filter the list. ↓ opens the popup and moves the virtual cursor. Enter or Tab selects. Escape clears the input and closes.

<ClientOnly>
<div class="demo-section">
  <div class="demo-row">
    <div class="demo-col">
      <label>Country</label>
      <rc-combobox id="country-cb" placeholder="Search countries…">
        <select slot="select" name="country">
          <option value="us">United States</option>
          <option value="ca">Canada</option>
          <option value="mx">Mexico</option>
          <option value="gb">United Kingdom</option>
          <option value="fr">France</option>
          <option value="de">Germany</option>
          <option value="jp">Japan</option>
          <option value="au">Australia</option>
          <option value="br">Brazil</option>
          <option value="in">India</option>
          <option value="it">Italy</option>
          <option value="es">Spain</option>
          <option value="kr">South Korea</option>
          <option value="se">Sweden</option>
          <option value="nl">Netherlands</option>
        </select>
      </rc-combobox>
    </div>
    <div class="demo-col">
      <label>Priority (with disabled)</label>
      <rc-combobox placeholder="Search…">
        <select slot="select" name="priority">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical" disabled>Critical (unavailable)</option>
        </select>
      </rc-combobox>
    </div>
  </div>
  <div class="event-log">
    <p v-if="!basicLog.length" class="placeholder">Events will appear here…</p>
    <p v-for="msg in basicLog" :key="msg">{{ msg }}</p>
  </div>
</div>
</ClientOnly>

```html
<rc-combobox placeholder="Search countries…">
  <select slot="select" name="country">
    <option value="us">United States</option>
    <option value="ca">Canada</option>
    <!-- ... -->
  </select>
</rc-combobox>
```

## Allow-create

When `allowcreate` is set and the typed text has no exact match, a *Create "X"* option appears at the bottom of the list. The `rc-combobox-create` event fires (cancelable) when the user confirms creation.

<ClientOnly>
<div class="demo-section">
  <div class="demo-col">
    <label>Ingredient (type a new one to create)</label>
    <rc-combobox id="create-cb" allowcreate placeholder="Search or create…">
      <select slot="select" name="ingredient">
        <option value="flour">Flour</option>
        <option value="sugar">Sugar</option>
        <option value="butter">Butter</option>
        <option value="eggs">Eggs</option>
        <option value="milk">Milk</option>
        <option value="vanilla">Vanilla extract</option>
        <option value="salt">Salt</option>
        <option value="baking-powder">Baking powder</option>
      </select>
    </rc-combobox>
  </div>
  <div class="event-log">
    <p v-if="!createLog.length" class="placeholder">Events will appear here…</p>
    <p v-for="msg in createLog" :key="msg">{{ msg }}</p>
  </div>
</div>
</ClientOnly>

```html
<rc-combobox allowcreate placeholder="Search or create…">
  <select slot="select" name="ingredient">
    <option value="flour">Flour</option>
    <!-- ... -->
  </select>
</rc-combobox>
```

```js
combobox.addEventListener('rc-combobox-create', (e) => {
  // e.detail.text — the new item label
  // e.preventDefault() to cancel the creation
  console.log('Creating:', e.detail.text);
});
```

## Multi-select with chips

Each selection becomes a chip in the input area. Backspace on empty input or ← at cursor start enters chip navigation mode.

<ClientOnly>
<div class="demo-section">
  <div class="demo-col">
    <label>Tags</label>
    <rc-combobox id="multi-cb" placeholder="Add tags…">
      <select slot="select" name="tags" multiple>
        <option value="bug">Bug</option>
        <option value="feature">Feature</option>
        <option value="docs">Documentation</option>
        <option value="design">Design</option>
        <option value="performance">Performance</option>
        <option value="security">Security</option>
        <option value="accessibility">Accessibility</option>
        <option value="testing">Testing</option>
        <option value="refactor">Refactor</option>
        <option value="ci">CI/CD</option>
      </select>
    </rc-combobox>
  </div>
  <div class="event-log">
    <p v-if="!multiLog.length" class="placeholder">Events will appear here…</p>
    <p v-for="msg in multiLog" :key="msg">{{ msg }}</p>
  </div>
</div>
</ClientOnly>

```html
<rc-combobox placeholder="Add tags…">
  <select slot="select" name="tags" multiple>
    <option value="bug">Bug</option>
    <!-- ... -->
  </select>
</rc-combobox>
```

## Multi-select + allow-create

Combine `multiple` with `allowcreate` for a fully dynamic tag input.

<ClientOnly>
<div class="demo-section">
  <div class="demo-col">
    <label>Labels (add your own)</label>
    <rc-combobox allowcreate placeholder="Search or create labels…">
      <select slot="select" name="labels" multiple>
        <option value="backend">Backend</option>
        <option value="frontend">Frontend</option>
        <option value="mobile">Mobile</option>
        <option value="infra">Infrastructure</option>
        <option value="data">Data</option>
      </select>
    </rc-combobox>
  </div>
</div>
</ClientOnly>

## Form integration

The native `<select slot="select">` is the form control. `FormData` reads its value on submit.

<ClientOnly>
<div class="demo-section">
  <form id="cb-demo-form">
    <div>
      <label for="cb-form-name">Name</label>
      <input id="cb-form-name" type="text" name="name" placeholder="Your name">
    </div>
    <div>
      <label>Role</label>
      <rc-combobox placeholder="Search a role…">
        <select slot="select" name="role">
          <option value="admin">Administrator</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
          <option value="guest">Guest</option>
        </select>
      </rc-combobox>
    </div>
    <div>
      <label>Interests (multi)</label>
      <rc-combobox placeholder="Add interests…">
        <select slot="select" name="interests" multiple>
          <option value="ux">UX</option>
          <option value="dev">Development</option>
          <option value="design">Design</option>
          <option value="data">Data science</option>
          <option value="ops">DevOps</option>
        </select>
      </rc-combobox>
    </div>
    <button type="submit">Submit</button>
  </form>
  <pre style="margin-top:0.75rem;padding:0.5rem 0.75rem;background:var(--vp-c-bg);border:1px solid var(--vp-c-divider);border-radius:4px;font-size:0.85rem;">{{ formOutput }}</pre>
</div>
</ClientOnly>

## Keyboard reference

| Key | Popup closed | Popup open |
| --- | --- | --- |
| ↓ | Open popup, move to first item | Move virtual cursor down |
| ↑ | — | Move virtual cursor up |
| Enter | — | Select active item (or activate Create) |
| Tab | — | Select first visible item, close popup |
| Esc | — | Clear input, close popup |
| Backspace (empty input) | Enter chip nav | — |
| ← (at cursor start) | Enter chip nav | — |
| Printable chars | Filter options, open popup | Continue filtering |

## API

<ApiTable tag="rc-combobox" />
