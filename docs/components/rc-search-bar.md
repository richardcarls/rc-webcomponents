<script setup>
import { nextTick, onMounted, ref } from 'vue';

const basicEvent = ref('—');
const cancelEvent = ref('—');
const trailingEvent = ref('—');
const controlledStatus = ref('type to fire events, or use the buttons below');

function setControlled(v) {
  const el = document.getElementById('bar-controlled');
  if (el) {
    el.value = v;
    controlledStatus.value = `.value = "${v}" written silently — no rc-search-bar-input fired`;
  }
}

onMounted(async () => {
  // <ClientOnly> schedules a second render pass on its own onMounted; wait
  // for that flush before querying the DOM for IDs inside those wrappers.
  await nextTick();

  const log = (id, r) => {
    const el = document.getElementById(id);
    el?.addEventListener('rc-search-bar-input', (e) => {
      r.value = `rc-search-bar-input { value: "${e.detail.value}" }`;
    });
    el?.addEventListener('rc-search-bar-clear', () => {
      r.value = 'rc-search-bar-clear';
    });
  };

  log('demo-basic', basicEvent);
  log('demo-cancel', cancelEvent);
  log('demo-trailing', trailingEvent);

  document.getElementById('demo-controlled')?.addEventListener('rc-search-bar-input', (e) => {
    controlledStatus.value = `rc-search-bar-input { value: "${e.detail.value}" } (user typed)`;
  });
  document.getElementById('demo-controlled')?.addEventListener('rc-search-bar-clear', () => {
    controlledStatus.value = 'rc-search-bar-clear (user cleared)';
  });
});
</script>

<style scoped>
/* ── Base demo layout ────────────────────────────────────────────────────── */
.demo-wrap {
  display: block;
}

.demo-wrap rc-search-bar {
  inline-size: min(24rem, 100%);
}

.event-log {
  margin-top: 0.75rem;
  padding: 0.4rem 0.6rem;
  background: var(--vp-c-bg-alt);
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-text-2);
  min-block-size: 1.8rem;
}

/* ── Styling variant grid ────────────────────────────────────────────────── */
.variant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(15rem, 100%), 1fr));
  gap: 1.25rem 2rem;
  margin-block: 1rem;
}

.variant {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.variant rc-search-bar {
  inline-size: 100%;
}

.variant-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--vp-c-text-3);
}

/* Outlined */
.v-outlined rc-search-bar::part(root) {
  border: 1px solid ButtonBorder;
  border-radius: 0.375rem;
}

/* Pill */
.v-pill rc-search-bar {
  --rc-search-bar-radius: 50em;
  --rc-search-bar-padding-inline: 1em;
}

/* Compact */
.v-compact rc-search-bar {
  --rc-search-bar-height: 32px;
  --rc-search-bar-input-font-size: 0.875rem;
  --rc-search-bar-radius: 0.25rem;
}

.v-compact rc-search-bar::part(root) {
  border: 1px solid ButtonBorder;
}

/* Elevated — Material-inspired */
.v-elevated rc-search-bar {
  --rc-search-bar-radius: 1.5rem;
  --rc-search-bar-height: 56px;
  --rc-search-bar-padding-inline: 1rem;
}

.v-elevated rc-search-bar::part(root) {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18), 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* Underline / minimal */
.v-underline rc-search-bar {
  --rc-search-bar-bg: transparent;
  --rc-search-bar-padding-inline: 0.25em;
}

.v-underline rc-search-bar::part(root) {
  border-bottom: 2px solid ButtonBorder;
  border-radius: 0;
}

/* Dark */
.v-dark {
  background: #1e1e2e;
  padding: 0.75rem;
  border-radius: 0.375rem;
}

.v-dark rc-search-bar {
  --rc-search-bar-bg: #2a2a3e;
  --rc-search-bar-color: #cdd6f4;
  --rc-search-bar-icon-color: #7f849c;
  --rc-search-bar-clear-color: #7f849c;
  --rc-search-bar-radius: 0.5rem;
}

/* Colored accent clear button */
.v-accent rc-search-bar {
  --rc-search-bar-radius: 0.375rem;
  --rc-search-bar-clear-color: AccentColor;
}

.v-accent rc-search-bar::part(root) {
  border: 1px solid ButtonBorder;
}

/* ── Interactive control buttons ─────────────────────────────────────────── */
.demo-buttons {
  display: flex;
  gap: 0.5em;
  flex-wrap: wrap;
  margin-top: 0.75rem;
}

.demo-buttons button {
  padding: 0.3em 0.8em;
  border: 1px solid ButtonBorder;
  border-radius: 0.25rem;
  background: ButtonFace;
  color: ButtonText;
  cursor: pointer;
  font: inherit;
  font-size: 0.8rem;
  line-height: 1.5;
}

.demo-buttons button:hover {
  background: Highlight;
  color: HighlightText;
}

/* ── Disabled visual cue ─────────────────────────────────────────────────── */
.demo-wrap rc-search-bar[disabled] {
  cursor: not-allowed;
}
</style>

# rc-search-bar

Enhances a consumer-provided native `<input type="search">` with leading icon
chrome, an accessible clear button, and debounced search events. The native
input is **required** and stays in light DOM as the source of truth — form
submission, label association, and pre-upgrade behavior are preserved.

[Native search input on MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/search)

<AtAGlance
  package-name="@rcarls/rc-search-bar"
  tag="rc-search-bar"
  native="Requires a native input[type=search] child"
  state="Controlled or uncontrolled value"
  :events="['rc-search-bar-input', 'rc-search-bar-clear']"
  :related="[
    { label: 'Progressive enhancement', href: '/guide/progressive-enhancement' },
    { label: 'rc-app-bar', href: '/components/rc-app-bar' }
  ]"
/>

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-search-bar
```

```sh [yarn]
yarn add @rcarls/rc-search-bar
```

:::

```js
import '@rcarls/rc-search-bar/define';
```

## Semantic markup

Wrap `rc-search-bar` in a [`<search>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/search)
element or a `<form role="search">` to expose a search landmark to assistive
technology and landmark-aware navigation. The component does not add a
`role="search"` landmark itself — that decision belongs to the page.

Use `<search>` for standalone, event-driven search (filtering, live site search):

```html
<search aria-label="Site search">
  <rc-search-bar placeholder="Search recipes">
    <span slot="leading" aria-hidden="true">🔍</span>
    <input type="search" name="q" aria-label="Search recipes" />
  </rc-search-bar>
</search>
```

Use `<form role="search">` when the search submits to a server or navigates to
a results URL:

```html
<form role="search" action="/results" method="get">
  <rc-search-bar placeholder="Search recipes">
    <span slot="leading" aria-hidden="true">🔍</span>
    <input type="search" name="q" aria-label="Search recipes" />
  </rc-search-bar>
  <button type="submit" class="visually-hidden">Submit search</button>
</form>
```

## Basic usage

Type to see the debounced `rc-search-bar-input` event (default 200 ms). The
clear button appears when the field has a value, fires `rc-search-bar-clear`
followed immediately by an empty `rc-search-bar-input`, and returns focus to
the input.

<ClientOnly>
<div class="demo-section demo-wrap" id="demo-basic">
  <search aria-label="Recipe search">
    <rc-search-bar placeholder="Search recipes">
      <span slot="leading" aria-hidden="true">&#128269;</span>
      <input type="search" name="q" aria-label="Search recipes" />
    </rc-search-bar>
  </search>
  <div class="event-log">{{ basicEvent }}</div>
</div>
</ClientOnly>

```html
<search aria-label="Recipe search">
  <rc-search-bar placeholder="Search recipes">
    <span slot="leading" aria-hidden="true">🔍</span>
    <input type="search" name="q" aria-label="Search recipes" />
  </rc-search-bar>
</search>
```

```js
document.querySelector('rc-search-bar').addEventListener('rc-search-bar-input', (e) => {
  console.log(e.detail.value); // debounced search term
});

document.querySelector('rc-search-bar').addEventListener('rc-search-bar-clear', () => {
  console.log('cleared'); // immediate, no debounce
});
```

The native WebKit cancel button is suppressed automatically so it does not
conflict with the component's clear button. Add `allow-native-clear` to restore
it.

The component's shadow CSS already strips the slotted input's native border,
background, and outline so it blends into the wrapper chrome — no consumer reset
needed.

## Slots

### Leading icon

The `leading` slot places an icon or graphic before the input. Mark decorative
icons `aria-hidden="true"` — the input's accessible name comes from its label,
not this slot.

<ClientOnly>
<div class="demo-section demo-wrap" style="display:flex; gap:1rem; flex-wrap:wrap; align-items:flex-start;">
  <search style="flex:1; min-inline-size:12rem;">
    <rc-search-bar placeholder="With icon">
      <span slot="leading" aria-hidden="true">&#128269;</span>
      <input type="search" aria-label="Search with icon" />
    </rc-search-bar>
  </search>
  <search style="flex:1; min-inline-size:12rem;">
    <rc-search-bar placeholder="No icon">
      <input type="search" aria-label="Search without icon" />
    </rc-search-bar>
  </search>
</div>
</ClientOnly>

```html
<!-- With icon -->
<rc-search-bar>
  <span slot="leading" aria-hidden="true">🔍</span>
  <input type="search" aria-label="Search" />
</rc-search-bar>

<!-- No icon -->
<rc-search-bar>
  <input type="search" aria-label="Search" />
</rc-search-bar>
```

### Trailing controls

The `trailing` slot places content at the far end of the field, after the clear
button. Use it for supplementary affordances that sit outside the primary
input–clear axis — a voice-search button, a keyboard shortcut badge, or a scoped
filter toggle. Controls placed here remain accessible via keyboard and are
announced by screen readers.

<ClientOnly>
<div class="demo-section demo-wrap" id="demo-trailing">
  <search aria-label="Search with voice">
    <rc-search-bar placeholder="Search or dictate">
      <span slot="leading" aria-hidden="true">&#128269;</span>
      <button
        slot="trailing"
        type="button"
        aria-label="Voice search"
        style="display:inline-grid;place-items:center;min-inline-size:2rem;min-block-size:2rem;border:none;background:none;cursor:pointer;border-radius:50%;color:GrayText;"
      >&#127908;</button>
      <input type="search" aria-label="Search or dictate" />
    </rc-search-bar>
  </search>
  <div class="event-log">{{ trailingEvent }}</div>
</div>
</ClientOnly>

```html
<!-- Trailing content appears after the clear button -->
<rc-search-bar>
  <span slot="leading" aria-hidden="true">🔍</span>
  <button
    slot="trailing"
    type="button"
    aria-label="Voice search"
    style="/* size + appearance */"
  >🎤</button>
  <input type="search" aria-label="Search or dictate" />
</rc-search-bar>
```

### Custom clear icon

Replace the default ✕ glyph via the `clear-icon` slot. Use any SVG, icon
component, or text character. The slot content replaces only the glyph; the
`<button>` element, its `aria-label`, focus ring, and hit-target size are
always provided by the component.

<ClientOnly>
<div class="demo-section demo-wrap" style="display:flex; gap:1rem; flex-wrap:wrap; align-items:flex-start;">
  <search style="flex:1; min-inline-size:12rem;">
    <rc-search-bar placeholder="Default ✕">
      <span slot="leading" aria-hidden="true">&#128269;</span>
      <input type="search" value="clear me" aria-label="Default clear icon" />
    </rc-search-bar>
  </search>
  <search style="flex:1; min-inline-size:12rem;">
    <rc-search-bar placeholder="Custom ×">
      <span slot="leading" aria-hidden="true">&#128269;</span>
      <span slot="clear-icon" aria-hidden="true" style="font-size:1.25rem;line-height:1;">&#215;</span>
      <input type="search" value="clear me" aria-label="Custom clear icon" />
    </rc-search-bar>
  </search>
</div>
</ClientOnly>

```html
<rc-search-bar>
  <span slot="leading" aria-hidden="true">🔍</span>
  <!-- Custom glyph replacing the default ✕ -->
  <span slot="clear-icon" aria-hidden="true">×</span>
  <input type="search" aria-label="Search" />
</rc-search-bar>
```

## Label association

The input stays in light DOM, so every native labeling strategy works without
any ARIA wiring from the component.

<ClientOnly>
<div class="demo-section demo-wrap" style="display:flex; flex-direction:column; gap:1.25rem;">
  <!-- label[for] -->
  <div>
    <div class="variant-label" style="margin-bottom:0.4rem;">label[for] + id</div>
    <search>
      <label for="docs-search-for" style="display:block; margin-bottom:0.4rem; font-size:0.875rem;">Search recipes</label>
      <rc-search-bar>
        <input type="search" id="docs-search-for" name="q" />
      </rc-search-bar>
    </search>
  </div>
  <!-- wrapping label -->
  <div>
    <div class="variant-label" style="margin-bottom:0.4rem;">Wrapping &lt;label&gt;</div>
    <search>
      <label style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.875rem;">
        Search recipes
        <rc-search-bar>
          <input type="search" name="q" />
        </rc-search-bar>
      </label>
    </search>
  </div>
  <!-- aria-label -->
  <div>
    <div class="variant-label" style="margin-bottom:0.4rem;">aria-label (icon-only context)</div>
    <search>
      <rc-search-bar>
        <span slot="leading" aria-hidden="true">&#128269;</span>
        <input type="search" aria-label="Search recipes" />
      </rc-search-bar>
    </search>
  </div>
</div>
</ClientOnly>

```html
<!-- 1. label[for] + id -->
<search>
  <label for="q">Search recipes</label>
  <rc-search-bar>
    <input type="search" id="q" name="q" />
  </rc-search-bar>
</search>

<!-- 2. Wrapping <label> -->
<search>
  <label>
    Search recipes
    <rc-search-bar>
      <input type="search" name="q" />
    </rc-search-bar>
  </label>
</search>

<!-- 3. aria-label on the input (icon-only context) -->
<search>
  <rc-search-bar>
    <span slot="leading" aria-hidden="true">🔍</span>
    <input type="search" aria-label="Search recipes" />
  </rc-search-bar>
</search>
```

## Cancel-on-focus

By default the clear button appears only when the input has a value. Set
`show-clear-on-focus` to show it whenever the input is focused — even with an
empty field. This matches the Apple HIG "Cancel" affordance used in sidebar and
modal search fields. Set `clear-label="Cancel"` to update the accessible name.

The `rc-search-bar-clear` event fires even when the value is empty, so the host
can dismiss a search overlay or blur the input.

<ClientOnly>
<div class="demo-section demo-wrap" id="demo-cancel">
  <div style="display:flex; gap:1rem; flex-wrap:wrap;">
    <div style="flex:1; min-inline-size:12rem;">
      <div class="variant-label" style="margin-bottom:0.4rem;">Default (clear on value)</div>
      <search>
        <rc-search-bar placeholder="Type something">
          <span slot="leading" aria-hidden="true">&#128269;</span>
          <input type="search" aria-label="Default clear behavior" />
        </rc-search-bar>
      </search>
    </div>
    <div style="flex:1; min-inline-size:12rem;">
      <div class="variant-label" style="margin-bottom:0.4rem;">show-clear-on-focus (cancel on focus)</div>
      <search>
        <rc-search-bar placeholder="Focus me" show-clear-on-focus clear-label="Cancel">
          <span slot="leading" aria-hidden="true">&#128269;</span>
          <input type="search" aria-label="Cancel on focus" />
        </rc-search-bar>
      </search>
    </div>
  </div>
  <div class="event-log">{{ cancelEvent }}</div>
</div>
</ClientOnly>

```html
<!-- Default: clear button visible when field has a value -->
<rc-search-bar>
  <span slot="leading" aria-hidden="true">🔍</span>
  <input type="search" aria-label="Search" />
</rc-search-bar>

<!-- show-clear-on-focus: visible on focus even with no value -->
<rc-search-bar show-clear-on-focus clear-label="Cancel">
  <span slot="leading" aria-hidden="true">🔍</span>
  <input type="search" aria-label="Search" />
</rc-search-bar>
```

```js
bar.addEventListener('rc-search-bar-clear', () => {
  // fires whether value was empty or not — use to dismiss search UI
  searchPanel.close();
  bar.blur(); // optional: move focus away after cancelling
});
```

## Styling

`rc-search-bar` is headless by default — system colors only, no imposed
aesthetic. Customize via CSS custom properties on the host and `::part()`
selectors on shadow parts.

<ClientOnly>
<div class="demo-section variant-grid">

  <div class="variant">
    <span class="variant-label">Bare default</span>
    <search>
      <rc-search-bar>
        <span slot="leading" aria-hidden="true">&#128269;</span>
        <input type="search" value="tomato" aria-label="Bare default" />
      </rc-search-bar>
    </search>
  </div>

  <div class="variant v-outlined">
    <span class="variant-label">Outlined</span>
    <search>
      <rc-search-bar>
        <span slot="leading" aria-hidden="true">&#128269;</span>
        <input type="search" value="tomato" aria-label="Outlined" />
      </rc-search-bar>
    </search>
  </div>

  <div class="variant v-pill">
    <span class="variant-label">Pill</span>
    <search>
      <rc-search-bar>
        <span slot="leading" aria-hidden="true">&#128269;</span>
        <input type="search" value="tomato" aria-label="Pill shape" />
      </rc-search-bar>
    </search>
  </div>

  <div class="variant v-compact">
    <span class="variant-label">Compact</span>
    <search>
      <rc-search-bar>
        <span slot="leading" aria-hidden="true">&#128269;</span>
        <input type="search" value="tomato" aria-label="Compact" />
      </rc-search-bar>
    </search>
  </div>

  <div class="variant v-elevated">
    <span class="variant-label">Elevated (Material-inspired)</span>
    <search>
      <rc-search-bar>
        <span slot="leading" aria-hidden="true">&#128269;</span>
        <input type="search" value="tomato" aria-label="Elevated" />
      </rc-search-bar>
    </search>
  </div>

  <div class="variant v-underline">
    <span class="variant-label">Underline / minimal</span>
    <search>
      <rc-search-bar>
        <span slot="leading" aria-hidden="true">&#128269;</span>
        <input type="search" value="tomato" aria-label="Underline minimal" />
      </rc-search-bar>
    </search>
  </div>

  <div class="variant v-accent">
    <span class="variant-label">Accent clear button</span>
    <search>
      <rc-search-bar>
        <span slot="leading" aria-hidden="true">&#128269;</span>
        <input type="search" value="tomato" aria-label="Accent clear button" />
      </rc-search-bar>
    </search>
  </div>

  <div class="variant v-dark">
    <span class="variant-label" style="color:#7f849c;">Dark / inverted</span>
    <search>
      <rc-search-bar>
        <span slot="leading" aria-hidden="true">&#128269;</span>
        <input type="search" value="tomato" aria-label="Dark inverted" />
      </rc-search-bar>
    </search>
  </div>

</div>
</ClientOnly>

### CSS custom properties

Control geometry and color without touching shadow parts:

```css
rc-search-bar {
  /* Size */
  --rc-search-bar-height: 40px;
  --rc-search-bar-padding-inline: 0.75em;
  --rc-search-bar-gap: 0.25em;
  --rc-search-bar-radius: 0.375rem;    /* or 50em for pill */

  /* Color */
  --rc-search-bar-bg: Field;           /* wrapper background */
  --rc-search-bar-color: FieldText;    /* wrapper text */
  --rc-search-bar-icon-color: GrayText;  /* leading icon */
  --rc-search-bar-clear-color: GrayText; /* clear glyph */

  /* Input typography (inherits by default) */
  --rc-search-bar-input-font-size: 1rem;
  --rc-search-bar-input-font-family: inherit;
  --rc-search-bar-input-color: inherit;
}
```

### `::part()` for structural styling

Target shadow parts when you need borders, shadows, or structural overrides
that CSS custom properties can't express:

```css
/* Outlined field */
rc-search-bar::part(root) {
  border: 1px solid ButtonBorder;
  border-radius: 0.375rem;
}

/* Elevated (Material-ish) */
rc-search-bar::part(root) {
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.18), 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 1.5rem;
}

/* Underline / minimal */
rc-search-bar {
  --rc-search-bar-bg: transparent;
  --rc-search-bar-padding-inline: 0;
}
rc-search-bar::part(root) {
  border-bottom: 2px solid ButtonBorder;
  border-radius: 0;
}

/* Styled clear button */
rc-search-bar::part(clear) {
  border: 1px solid ButtonBorder;
  background: ButtonFace;
  border-radius: 0.25rem;
  min-inline-size: 2rem;
  min-block-size: 2rem;
}
```

Available parts: `root`, `leading`, `trailing`, `clear`.

### Dark / inverted

Override the CSS custom properties directly when your design surface has a dark
background. The component uses system colors by default so it respects
`color-scheme` automatically — an explicit dark variant is only needed when
your token set diverges from the OS scheme:

```css
.dark-surface rc-search-bar {
  --rc-search-bar-bg: #2a2a3e;
  --rc-search-bar-color: #cdd6f4;
  --rc-search-bar-icon-color: #7f849c;
  --rc-search-bar-clear-color: #7f849c;
  --rc-search-bar-radius: 0.5rem;
}
```

## Controlled value

- **Uncontrolled** — the input and the user own the value. Seed it once with
  `default-value`; an author `value` attribute on the input wins over
  `default-value`.
- **Controlled** — write the `value` property from outside. Host writes are
  **silent** (no events fired) and win over slotted author values. User
  interaction always dispatches events normally.

<ClientOnly>
<div class="demo-section demo-wrap">
  <div id="demo-controlled">
    <search aria-label="Controlled search">
      <rc-search-bar id="bar-controlled" debounce="0" placeholder="Controlled search">
        <span slot="leading" aria-hidden="true">&#128269;</span>
        <input type="search" aria-label="Controlled search" />
      </rc-search-bar>
    </search>
  </div>
  <div class="demo-buttons">
    <button @click="setControlled('pasta')">Set "pasta"</button>
    <button @click="setControlled('tomato sauce')">Set "tomato sauce"</button>
    <button @click="setControlled('')">Clear</button>
  </div>
  <div class="event-log">{{ controlledStatus }}</div>
</div>
</ClientOnly>

```js
const bar = document.querySelector('rc-search-bar');

// Silent host write — does not fire rc-search-bar-input
bar.value = 'pasta';

// Read current value from the native input
console.log(bar.value); // 'pasta'
```

Use `default-value` to seed the initial value without taking control:

```html
<rc-search-bar default-value="initial hint">
  <input type="search" aria-label="Search" />
</rc-search-bar>
```

## Debounce

The `debounce` attribute sets the delay in milliseconds before
`rc-search-bar-input` fires after the user stops typing (default: `200`). Set
`debounce="0"` to fire on every keystroke.

<ClientOnly>
<div class="demo-section demo-wrap" style="display:flex; gap:1rem; flex-wrap:wrap;">
  <div style="flex:1; min-inline-size:12rem;">
    <div class="variant-label" style="margin-bottom:0.4rem;">debounce="0" (immediate)</div>
    <search>
      <rc-search-bar debounce="0" placeholder="Fires per keystroke" id="demo-debounce-0">
        <span slot="leading" aria-hidden="true">&#128269;</span>
        <input type="search" aria-label="Debounce 0" />
      </rc-search-bar>
    </search>
  </div>
  <div style="flex:1; min-inline-size:12rem;">
    <div class="variant-label" style="margin-bottom:0.4rem;">debounce="600" (slow)</div>
    <search>
      <rc-search-bar debounce="600" placeholder="Fires after pause" id="demo-debounce-600">
        <span slot="leading" aria-hidden="true">&#128269;</span>
        <input type="search" aria-label="Debounce 600" />
      </rc-search-bar>
    </search>
  </div>
</div>
</ClientOnly>

```html
<!-- Synchronous — one event per keystroke; useful for local in-memory filtering -->
<rc-search-bar debounce="0">
  <input type="search" aria-label="Search" />
</rc-search-bar>

<!-- Delayed — fires once after the user pauses; reduces API calls -->
<rc-search-bar debounce="400">
  <input type="search" aria-label="Search" />
</rc-search-bar>
```

The clear button always fires `rc-search-bar-input` immediately regardless of
the `debounce` value, and cancels any pending debounced dispatch.

## Disabled

Set `disabled` on the component to disable both the native input and the clear
button. The component mirrors the attribute to the slotted input; a
`MutationObserver` keeps the two in sync if the input's `disabled` attribute
changes independently.

<ClientOnly>
<div class="demo-section demo-wrap" style="display:flex; gap:1rem; flex-wrap:wrap;">
  <search style="flex:1; min-inline-size:12rem;">
    <rc-search-bar disabled placeholder="Disabled, no value">
      <span slot="leading" aria-hidden="true">&#128269;</span>
      <input type="search" aria-label="Disabled empty" />
    </rc-search-bar>
  </search>
  <search style="flex:1; min-inline-size:12rem;">
    <rc-search-bar disabled placeholder="Disabled, has value">
      <span slot="leading" aria-hidden="true">&#128269;</span>
      <input type="search" value="pasta" aria-label="Disabled with value" />
    </rc-search-bar>
  </search>
</div>
</ClientOnly>

```html
<rc-search-bar disabled>
  <input type="search" aria-label="Search" />
</rc-search-bar>
```

The component reflects `disabled` as a host attribute, so you can target it in
CSS:

```css
rc-search-bar[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Material bridge

`@rcarls/rc-theme-material` maps M3 search-container, input, icon, size, shape,
and system color roles into this component. The mapping follows M3 terminology
because Material Web does not currently ship an equivalent search-bar element.
See [Theme previews](/guide/theme-previews) for integration details.

## API

<ApiTable tag="rc-search-bar" />
