# `@rcarls/rc-listbox`

Listbox that keeps option DOM in light DOM for `aria-activedescendant` navigation, following the [WAI-ARIA Listbox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/).

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-listbox](https://richardcarls.github.io/rc-webcomponents/components/rc-listbox).

`rc-listbox` is primarily an infrastructure component that can be used
directly when an application or component controls option data and selection state.

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

Options may also represent actions instead of selectable values:

```ts
listbox.options = [
  { value: 'none', label: 'None' },
  { kind: 'action', action: 'clear', value: 'clear', label: 'Clear selection' },
];

listbox.addEventListener('rc-listbox-change', (event) => {
  if (event.detail.reason === 'action') {
    // event.detail.option is narrowed to ListboxActionOption
    return;
  }

  // event.detail.option is narrowed to ListboxSelectableOption
});
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
| `rc-listbox-change` | `{ reason: 'select'; value; selected; option } \| { reason: 'action'; action; option }` | Fires when an option or action row is activated. |

## Accessibility

- Host role defaults to `listbox`.
- Options render with `role="option"` and `aria-selected`.
- Disabled options render with `aria-disabled="true"` and are omitted from
  `navigableItems`.
- Multi-select mode reflects `aria-multiselectable="true"`.
