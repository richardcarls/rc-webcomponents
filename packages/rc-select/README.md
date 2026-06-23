# `@rcarls/rc-select`

A progressive enhancement implementation of the single- and multi-select
[WAI-ARIA APG Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

## Installation

PowerShell:

```powershell
yarn.cmd add @rcarls/rc-select
```

Bash/zsh:

```bash
yarn add @rcarls/rc-select
```

## Import

```ts
import '@rcarls/rc-select/define';
```

## Basic Usage

```html
<label>
  Fruit
  <rc-select placeholder="Choose fruit">
    <select slot="select" name="fruit">
      <option value="">Choose fruit</option>
      <option value="apple">Apple</option>
      <option value="banana">Banana</option>
      <option value="cherry" disabled>Cherry</option>
    </select>
  </rc-select>
</label>
```

## API

| Property / method | Type | Description |
| --- | --- | --- |
| `open` | `boolean` | Current popup state. |
| `multiple` | `boolean` | Mirrors the slotted `<select multiple>` state. |
| `disabled` | `boolean` | Mirrors the slotted `<select disabled>` state. |
| `placeholder` | `string` | Text shown when no value is selected. |
| `display` | `'auto' \| 'chips' \| 'compact'` | Controls multi-select display. |
| `openPopup()` | `void` | Opens the listbox popover. |
| `closePopup(returnFocus?)` | `void` | Closes the listbox and optionally restores focus. |
| `setSelected(values)` | `void` | Replaces selection without relying on mutation observation. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `rc-select-change` | `{ value: string \| string[] }` | Fires when selection changes. |
| `rc-select-open` | none | Fires when the popup opens. |
| `rc-select-close` | none | Fires when the popup closes. |

## Accessibility

- Trigger uses `role="combobox"`, `aria-haspopup="listbox"`, and
  `aria-activedescendant`.
- The popup uses `rc-listbox` for `role="listbox"` and option state.
- Accessible name is copied from the slotted select label or `aria-label` unless
  the trigger has an explicit label.
