# `@rcarls/rc-combobox`

A web component implementation of the [WAI-ARIA APG combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/),
with autocomplete filtering and optional on-the-fly item creation.

Extends `rc-select` with a text input and wraps a native slotted `<select>`.

## Installation

PowerShell:

```powershell
yarn.cmd add @rcarls/rc-combobox
```

Bash/zsh:

```bash
yarn add @rcarls/rc-combobox
```

## Import

```ts
import '@rcarls/rc-combobox/define';
```

## Basic Usage

```html
<label>
  Fruit
  <rc-combobox placeholder="Search fruit">
    <select name="fruit">
      <option value="apple">Apple</option>
      <option value="banana">Banana</option>
      <option value="cherry">Cherry</option>
    </select>
  </rc-combobox>
</label>
```

## Allow Create

Add `allow-create` to show a **"Create 'X'"** option when the typed text has no exact match.
Selecting it inserts the new option into the native `<select>`, selects it, and fires `rc-combobox-create`.

```html
<rc-combobox allow-create placeholder="Add tag">
  <select name="tags" multiple></select>
</rc-combobox>
```

### Validation

`rc-combobox-create` is cancelable. Call `event.preventDefault()` to block insertion when the
text fails validation. The default behavior (insert + select) runs otherwise.

```js
combobox.addEventListener('rc-combobox-create', (event) => {
  if (event.detail.text.trim().length < 2) {
    event.preventDefault();
    showError('Tag must be at least 2 characters.');
  }
});
```

### React — managing options as state

Call `preventDefault()` and add the new item to your React state instead. After React renders
the new `<option>`, set `el.value` in a `useEffect` to select it:

```tsx
const [options, setOptions] = useState(initialOptions);
const pendingValue = useRef<string | null>(null);
const comboRef = useRef<HTMLElement & { value: string | string[] | undefined }>(null);

useEffect(() => {
  const el = comboRef.current;
  if (!el) return;
  const handleCreate = (e: Event) => {
    e.preventDefault();
    const { text } = (e as CustomEvent<{ text: string }>).detail;
    const value = text.trim().toLowerCase().replace(/\s+/g, '-');
    setOptions((prev) => [...prev, { value, label: text.trim() }]);
    pendingValue.current = value;
  };
  el.addEventListener('rc-combobox-create', handleCreate);
  return () => el.removeEventListener('rc-combobox-create', handleCreate);
}, []);

// Runs after React renders the new <option>; component has already processed slotchange.
useEffect(() => {
  const value = pendingValue.current;
  if (!value || !comboRef.current) return;
  pendingValue.current = null;
  const el = comboRef.current;
  const current = Array.isArray(el.value) ? el.value : el.value ? [el.value] : [];
  if (!current.includes(value)) {
    el.value = [...current, value];
  }
}, [options]);
```

### Form usage — ephemeral options until committed

By default, created options are added to the native `<select>` and appear in `FormData` on submit
but are discarded on page reload. To persist them on submit, track them alongside the option list:

```js
const pending = new Set();

combobox.addEventListener('rc-combobox-create', (event) => {
  pending.add(event.detail.text.trim());
  // Default runs — option is inserted and selected.
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const selected = data.getAll('tags');
  const newValues = selected.filter((v) => pending.has(v));
  // Save newValues to the server; they become persisted options next load.
});
```

## Controlled vs Uncontrolled

**Uncontrolled (default):** set `<option selected>` or `default-value` for the initial value;
the component owns selection thereafter. Listen to `rc-select-change` to observe changes.

**Controlled:** write `el.value` (the property) to drive selection programmatically. Writes are
silent — no `rc-select-change` is dispatched. Update `el.value` in response to `rc-select-change`
to keep external state in sync.

```js
combobox.value = 'banana';                // single
combobox.value = ['apple', 'cherry'];     // multiple
```

For `allow-create`, the same split applies to options:

- **Uncontrolled options:** let the default behavior add the new `<option>` to the native `<select>`.
- **Controlled options:** call `event.preventDefault()` on `rc-combobox-create` and manage `<option>`
  elements yourself (e.g., in React state), then set `el.value` to include the new value.

## API

| Property | Type | Description |
| --- | --- | --- |
| `allowCreate` | `boolean` | Shows a create option for unmatched input. |
| `filterStrategy` | `'prefix' \| 'contains' \| function` | Controls option filtering. |
| `multiple` | `boolean` | Inherited from `rc-select`; supports chip rendering. |
| `placeholder` | `string` | Input placeholder when no value is selected. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `rc-combobox-create` | `{ text: string }` | Cancelable event fired before a new option is inserted. |
| `rc-select-change` | `{ value: string \| string[] }` | Inherited selection-change event. |

## Accessibility

- Input uses `role="combobox"` with `aria-autocomplete="list"`.
- Popup navigation uses `aria-activedescendant`.
- The slotted native `<select>` remains the form value source.
