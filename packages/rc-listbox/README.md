# `@rcarls/rc-listbox`

A headless WAI-ARIA listbox component built with Lit 3. It renders option
elements into light DOM so parent components can use `aria-activedescendant`
with IDs that resolve in the same document or shadow root.

`rc-listbox` is primarily an infrastructure component for `rc-select` and
`rc-combobox`, but it can be used directly when an application controls option
state from JavaScript.

## Installation

PowerShell:

```powershell
yarn.cmd add @rcarls/rc-listbox
```

Bash/zsh:

```bash
yarn add @rcarls/rc-listbox
```

## Import

```ts
import '@rcarls/rc-listbox/define';
```

## Basic Usage

```ts
const listbox = document.querySelector('rc-listbox');

listbox.options = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry', disabled: true },
];

listbox.setSelectedValues(['apple']);
```

## API

| Property / method | Type | Description |
| --- | --- | --- |
| `multiple` | `boolean` | Enables multi-selection and reflects `aria-multiselectable`. |
| `filterStrategy` | `'prefix' \| 'contains' \| function` | Controls how `filterOptions()` matches labels. |
| `options` | `ListboxOption[]` | Replaces the rendered option list. |
| `allOptions` | `readonly ListboxOption[]` | All configured options. |
| `filteredOptions` | `readonly ListboxOption[]` | Options currently passing the filter. |
| `selectedValues` | `string[]` | Current selected values. |
| `appendOption(opt)` | `void` | Adds one option. |
| `setSelectedValues(values)` | `void` | Replaces selection without firing an event. |
| `toggleOption(value)` | `void` | Toggles selection and fires `rc-listbox-change`. |
| `clearSelection()` | `void` | Clears selected values. |
| `filterOptions(text)` | `void` | Filters visible options. |
| `clearFilter()` | `void` | Clears the active filter. |
| `navigableItems` | `Element[]` | Visible, enabled options for active-descendant navigation. |
| `setCreateOption(label)` | `void` | Shows or hides the synthetic create option. |

## Events

| Event | Detail | Description |
| --- | --- | --- |
| `rc-listbox-change` | `{ value: string; selected: boolean }` | Fires when an option is activated. |

## Accessibility

- Host role defaults to `listbox`.
- Options render with `role="option"` and `aria-selected`.
- Disabled options render with `aria-disabled="true"` and are omitted from
  `navigableItems`.
- Multi-select mode reflects `aria-multiselectable="true"`.
