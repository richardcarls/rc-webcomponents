# `@rcarls/rc-search-bar`

Enhances a consumer-provided native `<input type="search">` with leading icon
chrome, an accessible clear button, and debounced search events.

The native input is **required** and stays in light DOM as the source of
truth: form submission (`name`), label association (`label[for]`, wrapping
`<label>`, `aria-label`), and pre-upgrade usability all keep working. Without
a slotted search input the component renders no chrome and stays inert.

---

## Installation

```bash
npm install @rcarls/rc-search-bar
```

## Import

```js
// Registers <rc-search-bar>
import '@rcarls/rc-search-bar/define';

// Or import the class without registering
import { RCSearchBar } from '@rcarls/rc-search-bar';
```

---

## Basic usage

```html
<search>
  <label for="q" class="visually-hidden">Search recipes</label>
  <rc-search-bar placeholder="Search 51 recipes">
    <span slot="leading" aria-hidden="true">🔍</span>
    <input type="search" id="q" name="q" />
  </rc-search-bar>
</search>

<script>
  document.querySelector('rc-search-bar').addEventListener(
    'rc-search-bar-input',
    (e) => console.log(e.detail.value),
  );
</script>
```

Recommended consumer CSS — the shadow wrapper provides the field chrome, so
strip the slotted input's own (shadow CSS cannot style light-DOM content):

```css
rc-search-bar input[type='search'] {
  background: transparent;
  border: none;
  outline: none;
  font: inherit;
  color: inherit;
}

/* Optional: hide the native WebKit cancel button in favor of the
   component's clear button. */
rc-search-bar input[type='search']::-webkit-search-cancel-button {
  -webkit-appearance: none;
  display: none;
}
```

---

## Controlled and uncontrolled value

- **Uncontrolled** — the input (and the user) own the value. Optionally seed
  it with `default-value`; an author `value` attribute on the input wins over
  `default-value`.
- **Controlled** — assign the `value` property. Host writes are silent (no
  events) and win over slotted author values, including across re-slots.
  User interaction always dispatches events.

---

## API

### Properties / attributes

| Property | Attribute | Type | Default | Description |
|---|---|---|---|---|
| `value` | — | `string` | `''` | Current search value; reads from the native input, host writes are silent |
| `defaultValue` | `default-value` | `string \| undefined` | `undefined` | Initial uncontrolled value hint, applied once |
| `debounce` | `debounce` | `number` | `200` | Debounce window in ms for `rc-search-bar-input`; `0` dispatches synchronously |
| `clearLabel` | `clear-label` | `string` | `'Clear search'` | Accessible label for the clear button |
| `placeholder` | `placeholder` | `string \| undefined` | `undefined` | Mirrored onto the input unless the author already set one |

### CSS custom properties

| Property | Default | Description |
|---|---|---|
| `--rc-search-bar-bg` | `Field` | Wrapper background |
| `--rc-search-bar-color` | `FieldText` | Wrapper text color |
| `--rc-search-bar-icon-color` | `GrayText` | Leading icon color |
| `--rc-search-bar-clear-color` | `GrayText` | Clear button glyph color |
| `--rc-search-bar-radius` | `var(--rc-control-radius, 0)` | Wrapper border radius |
| `--rc-search-bar-height` | `48px` | Wrapper block size |
| `--rc-search-bar-padding-inline` | `0.5em` | Wrapper horizontal padding |
| `--rc-search-bar-gap` | `0.25em` | Gap between icon, input, and clear button |

### CSS parts

| Part | Element | Description |
|---|---|---|
| `root` | wrapper `div` | The field chrome |
| `leading` | `span` | Wrapper around the leading icon slot |
| `clear` | `button` | The clear button |

### Slots

| Slot | Description |
|---|---|
| *(default)* | The required native `<input type="search">` |
| `leading` | Decorative leading icon; mark it `aria-hidden="true"` |
| `clear-icon` | Optional glyph replacing the default ✕ in the clear button |

### Events

| Event | Detail | Description |
|---|---|---|
| `rc-search-bar-input` | `{ value: string }` | Debounced after typing; fired immediately (pending timer cancelled) on clear |
| `rc-search-bar-clear` | `{}` | Fired when the clear button is activated |

---

## Accessibility notes

- The component writes no ARIA to the input — `type="search"` already exposes
  the `searchbox` role, and author labels are never overwritten. Label the
  input with `label[for]`, a wrapping `<label>`, or `aria-label`.
- The component adds no `role="search"` landmark; wrap in `<search>` or
  `<form role="search">` when the bar is the page's search landmark.
- The clear button is a real `<button>` with a configurable `aria-label`
  (`clear-label`) and a ≥24×24 px hit target. Activating it returns focus to
  the input before the button hides, so focus is never dropped.
- The native WebKit cancel button is not suppressed. If left visible it
  clears through the normal input path (a debounced `rc-search-bar-input`
  with an empty value) and never fires `rc-search-bar-clear`; hide it with
  the CSS snippet above if you want a single clear affordance.

---

## Browser support

Evergreen browsers. The component is inert without JavaScript: the native
search input remains fully usable and form-associated before upgrade.
