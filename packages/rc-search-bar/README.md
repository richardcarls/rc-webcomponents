# `@rcarls/rc-search-bar`

Search field wrapper for a native `<input type="search">` with icon chrome, clear button, and debounced events.

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-search-bar](https://richardcarls.github.io/rc-webcomponents/components/rc-search-bar).

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
  document
    .querySelector('rc-search-bar')
    .addEventListener('rc-search-bar-input', (e) => console.log(e.detail.value));
</script>
```

The component's shadow CSS already strips the slotted input's native border,
background, and outline so it blends into the wrapper chrome — no consumer reset
needed.

The native WebKit cancel button is suppressed automatically. Set
`allow-native-clear` to restore it.

---

## API

### Properties / attributes

| Property           | Attribute             | Type                  | Default          | Description                                                                             |
| ------------------ | --------------------- | --------------------- | ---------------- | --------------------------------------------------------------------------------------- |
| `value`            | —                     | `string`              | `''`             | Current search value; reads from the native input, host writes are silent               |
| `defaultValue`     | `default-value`       | `string \| undefined` | `undefined`      | Initial uncontrolled value hint, applied once                                           |
| `debounce`         | `debounce`            | `number`              | `200`            | Debounce window in ms for `rc-search-bar-input`; `0` dispatches synchronously           |
| `clearLabel`       | `clear-label`         | `string`              | `'Clear search'` | Accessible label for the clear button                                                   |
| `allowNativeClear` | `allow-native-clear`  | `boolean`             | `false`          | When set, restores the browser's native WebKit cancel button                            |
| `showClearOnFocus` | `show-clear-on-focus` | `boolean`             | `false`          | When set, shows the clear button on focus even with no value (Apple HIG cancel pattern) |
| `placeholder`      | `placeholder`         | `string \| undefined` | `undefined`      | Mirrored onto the input unless the author already set one                               |

### CSS custom properties

| Property                         | Default                                     | Description                               |
| -------------------------------- | ------------------------------------------- | ----------------------------------------- |
| `--rc-search-bar-border`         | `1px solid ButtonBorder`                    | Border; M3 theme uses elevation instead   |
| `--rc-search-bar-shadow`         | `none`                                      | Elevation shadow; M3 sets Level 1 at rest |
| `--rc-search-bar-bg`             | `Field`                                     | Wrapper background                        |
| `--rc-search-bar-color`          | `FieldText`                                 | Wrapper text color                        |
| `--rc-search-bar-icon-color`     | `GrayText`                                  | Leading icon color                        |
| `--rc-search-bar-clear-color`    | `GrayText`                                  | Clear button glyph color                  |
| `--rc-search-bar-radius`         | `var(--rc-control-radius, 0.125em)`         | Wrapper border radius                     |
| `--rc-search-bar-height`         | `var(--rc-control-block-size, 2.5rem)`      | Wrapper block size                        |
| `--rc-search-bar-padding-inline` | `var(--rc-control-padding-inline, 0.75rem)` | Wrapper horizontal padding                |
| `--rc-search-bar-gap`            | `var(--rc-control-gap, 0.25em)`             | Gap between icon, input, and clear button |

### CSS parts

| Part      | Element       | Description                          |
| --------- | ------------- | ------------------------------------ |
| `root`    | wrapper `div` | The field chrome                     |
| `leading` | `span`        | Wrapper around the leading icon slot |
| `clear`   | `button`      | The clear button                     |

### Slots

| Slot         | Description                                                               |
| ------------ | ------------------------------------------------------------------------- |
| _(default)_  | The required native `<input type="search">`                               |
| `leading`    | Decorative leading icon; mark it `aria-hidden="true"`                     |
| `clear-icon` | Optional glyph replacing the default ✕ in the clear button                |
| `trailing`   | Optional content after the clear button (supplementary badges or actions) |

### Events

| Event                 | Detail              | Description                                                                  |
| --------------------- | ------------------- | ---------------------------------------------------------------------------- |
| `rc-search-bar-input` | `{ value: string }` | Debounced after typing; fired immediately (pending timer cancelled) on clear |
| `rc-search-bar-clear` | `{}`                | Fired when the clear button is activated                                     |

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
- The native WebKit cancel button is suppressed automatically via an adopted
  document stylesheet. Set `allow-native-clear` to restore it. When restored,
  it clears through the normal input path (a debounced `rc-search-bar-input`
  with an empty value) and never fires `rc-search-bar-clear`.
- Set `show-clear-on-focus` to show the clear button whenever the input is
  focused (Apple HIG cancel pattern). Consider `clear-label="Cancel"` in this
  mode. The `rc-search-bar-clear` event fires even when the value is empty,
  allowing the host to dismiss a search overlay.
