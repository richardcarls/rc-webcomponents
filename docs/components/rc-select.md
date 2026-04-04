<script setup>
import { ref, onMounted } from 'vue';

const singleLog = ref([]);
const multiLog = ref([]);
const formOutput = ref('FormData will appear here after submit.');
let dynamicCount = 2;

onMounted(() => {
  const countrySelect = document.getElementById('country-select');
  if (countrySelect) {
    countrySelect.addEventListener('rc-select-change', (e) => {
      singleLog.value = [`rc-select-change → value: "${e.detail.value}"`, ...singleLog.value].slice(0, 20);
    });
  }

  const tagsSelect = document.getElementById('tags-select');
  if (tagsSelect) {
    tagsSelect.addEventListener('rc-select-change', (e) => {
      multiLog.value = [`rc-select-change → value: [${e.detail.value.join(', ')}]`, ...multiLog.value].slice(0, 20);
    });
  }

  const form = document.getElementById('rc-select-demo-form');
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

function addDynamicOption() {
  dynamicCount++;
  const sel = document.querySelector('#dynamic-select select');
  if (!sel) return;
  const opt = document.createElement('option');
  opt.value = `item${dynamicCount}`;
  opt.text = `Item ${dynamicCount}`;
  sel.add(opt);
}
</script>

# rc-select

A headless select-only ARIA combobox backed by a native `<select>`. The component keeps the slotted `<select>` as the source of truth for form submission while rendering a custom trigger and popover listbox.

[WAI-ARIA Combobox Pattern (select-only)](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-select
```

```sh [yarn]
yarn add @rcarls/rc-select
```

:::

```js
import '@rcarls/rc-select/define';
```

## Single-select

Full keyboard navigation: Arrow keys, Home/End, type-ahead. Closes on selection or Escape.

<ClientOnly>
<div class="demo-section">
  <div class="demo-row">
    <div class="demo-col">
      <label>Country</label>
      <rc-select id="country-select" placeholder="Choose a country…">
        <select slot="select" name="country">
          <option value="">Choose a country…</option>
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
        </select>
      </rc-select>
    </div>
    <div class="demo-col">
      <label>Priority (with disabled option)</label>
      <rc-select placeholder="Select priority…">
        <select slot="select" name="priority">
          <option value="">Select priority…</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical" disabled>Critical (unavailable)</option>
        </select>
      </rc-select>
    </div>
    <div class="demo-col">
      <label>Disabled</label>
      <rc-select placeholder="Not available">
        <select slot="select" name="disabled-example" disabled>
          <option value="a">Option A</option>
          <option value="b">Option B</option>
        </select>
      </rc-select>
    </div>
  </div>
  <div class="event-log">
    <p v-if="!singleLog.length" class="placeholder">Events will appear here…</p>
    <p v-for="msg in singleLog" :key="msg">{{ msg }}</p>
  </div>
</div>
</ClientOnly>

```html
<rc-select placeholder="Choose a country…">
  <select slot="select" name="country">
    <option value="">Choose a country…</option>
    <option value="us">United States</option>
    <option value="ca">Canada</option>
    <!-- ... -->
  </select>
</rc-select>
```

## Multi-select — chips

Select multiple items. Chips render inline in the trigger. Use Arrow Left from the trigger to navigate chip remove buttons.

<ClientOnly>
<div class="demo-section">
  <div class="demo-row">
    <div class="demo-col">
      <label>Tags</label>
      <rc-select id="tags-select" placeholder="Add tags…">
        <select slot="select" name="tags" multiple>
          <option value="bug">Bug</option>
          <option value="feature">Feature</option>
          <option value="docs">Documentation</option>
          <option value="design">Design</option>
          <option value="performance">Performance</option>
          <option value="security">Security</option>
          <option value="accessibility">Accessibility</option>
          <option value="testing">Testing</option>
        </select>
      </rc-select>
    </div>
  </div>
  <div class="event-log">
    <p v-if="!multiLog.length" class="placeholder">Events will appear here…</p>
    <p v-for="msg in multiLog" :key="msg">{{ msg }}</p>
  </div>
</div>
</ClientOnly>

```html
<rc-select placeholder="Add tags…">
  <select slot="select" name="tags" multiple>
    <option value="bug">Bug</option>
    <option value="feature">Feature</option>
    <!-- ... -->
  </select>
</rc-select>
```

## Multi-select — compact display

`display="compact"` shows a summary label instead of chips. Useful for coarse-pointer or space-constrained layouts.

<ClientOnly>
<div class="demo-section">
  <div class="demo-row">
    <div class="demo-col">
      <label>Languages (compact)</label>
      <rc-select display="compact" placeholder="Select languages…">
        <select slot="select" name="languages" multiple>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
          <option value="pt">Portuguese</option>
          <option value="ar">Arabic</option>
        </select>
      </rc-select>
    </div>
  </div>
</div>
</ClientOnly>

```html
<rc-select display="compact" placeholder="Select languages…">
  <select slot="select" name="languages" multiple>
    <option value="en">English</option>
    <!-- ... -->
  </select>
</rc-select>
```

## Form integration

The native `<select slot="select">` acts as the form control. `FormData` picks up its value automatically — no JavaScript required.

<ClientOnly>
<div class="demo-section">
  <form id="rc-select-demo-form" style="display:flex;flex-direction:column;gap:0.75rem;max-width:28em;">
    <div style="display:flex;flex-direction:column;gap:0.25rem;">
      <label for="form-name" style="font-size:0.875rem;font-weight:600;">Name</label>
      <input id="form-name" type="text" name="name" placeholder="Your name"
        style="padding:0.35em 0.5em;border:1px solid ButtonBorder;border-radius:0.125em;background:Field;color:FieldText;font:inherit;" />
    </div>
    <div style="display:flex;flex-direction:column;gap:0.25rem;">
      <label style="font-size:0.875rem;font-weight:600;">Role</label>
      <rc-select placeholder="Select a role…">
        <select slot="select" name="role">
          <option value="">Select a role…</option>
          <option value="admin">Administrator</option>
          <option value="editor">Editor</option>
          <option value="viewer">Viewer</option>
        </select>
      </rc-select>
    </div>
    <div style="display:flex;flex-direction:column;gap:0.25rem;">
      <label style="font-size:0.875rem;font-weight:600;">Permissions</label>
      <rc-select placeholder="Add permissions…">
        <select slot="select" name="permissions" multiple>
          <option value="read">Read</option>
          <option value="write">Write</option>
          <option value="delete">Delete</option>
          <option value="publish">Publish</option>
        </select>
      </rc-select>
    </div>
    <button type="submit"
      style="align-self:flex-start;padding:0.4em 1em;border:1px solid ButtonBorder;border-radius:0.125em;background:ButtonFace;color:ButtonText;font:inherit;cursor:pointer;">
      Submit
    </button>
  </form>
  <pre style="margin-top:0.75rem;padding:0.5rem 0.75rem;background:var(--vp-c-bg);border:1px solid var(--vp-c-divider);border-radius:4px;font-size:0.85rem;">{{ formOutput }}</pre>
</div>
</ClientOnly>

```html
<form>
  <rc-select placeholder="Select a role…">
    <select slot="select" name="role">
      <option value="admin">Administrator</option>
      <!-- ... -->
    </select>
  </rc-select>
  <button type="submit">Submit</button>
</form>
```

## Dynamic options

Options added to the native `<select>` at runtime are reflected in the popup automatically via `MutationObserver`.

<ClientOnly>
<div class="demo-section">
  <div class="demo-row" style="align-items:center;">
    <rc-select id="dynamic-select" placeholder="Choose an item…">
      <select slot="select" name="dynamic">
        <option value="">Choose an item…</option>
        <option value="item1">Item 1</option>
        <option value="item2">Item 2</option>
      </select>
    </rc-select>
    <button @click="addDynamicOption"
      style="padding:0.35em 0.75em;cursor:pointer;border:1px solid ButtonBorder;border-radius:4px;background:ButtonFace;color:ButtonText;font:inherit;">
      Add option
    </button>
  </div>
</div>
</ClientOnly>

## API

<ApiTable tag="rc-select" />
