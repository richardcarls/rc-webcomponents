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
    <select slot="select" name="fruit">
      <option value="apple">Apple</option>
      <option value="banana">Banana</option>
      <option value="cherry">Cherry</option>
    </select>
  </rc-combobox>
</label>
```

## Allow Create

```html
<rc-combobox allowcreate placeholder="Add tag">
  <select slot="select" name="tags" multiple></select>
</rc-combobox>
```

Cancel `rc-combobox-create` to validate or replace the default insertion.

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
