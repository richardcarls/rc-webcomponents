# @rcarls/rc-transfer-list

Enhances a `<select multiple>` element to become a side-by-side transfer list.

The component renders two listboxes and transfer/reorder actions in between.
Available options are on the left, and selected options appear on the right. It
is an older enterprise/admin UI pattern, but solves the specific problem of
multiple selection within a large amount of options.

Modern use cases include user and permissions management tasks, multi-select for
columns / fields / filters and list re-ordering.

## Installation

```bash
npm install @rcarls/rc-transfer-list
```

```bash
yarn add @rcarls/rc-transfer-list
```

## Import

```js
import '@rcarls/rc-transfer-list/define';
```

## Usage

```html
<rc-transfer-list available-label="Available planets" selected-label="Mission route">
  <select name="planets" multiple>
    <option value="mercury">Mercury</option>
    <option value="venus" selected>Venus</option>
    <option value="earth">Earth</option>
    <option value="mars">Mars</option>
  </select>
</rc-transfer-list>
```

The selected/right-hand list is reflected back to the native select, so form
submission serializes selected option values in the order shown in the selected
panel.

Use the `compact` attribute when the surrounding layout should present the
available list, actions, and selected list in one column. The component does not
switch layout automatically at viewport breakpoints.

## API

### Properties

| Property | Attribute | Type | Default | Description |
|---|---|---|---|---|
| `multiple` | `multiple` | `boolean` | `false` | Allows multiple highlighted rows in each listbox. |
| `compact` | `compact` | `boolean` | `false` | Stacks the panels and action toolbar into a compact one-column layout. |
| `availableLabel` | `available-label` | `string` | `'Available'` | Visible label for the available list. |
| `selectedLabel` | `selected-label` | `string` | `'Selected'` | Visible label for the selected list. |
| `available` | - | `ListboxOption[]` | native select state | Gets or replaces unselected options. |
| `selected` | - | `ListboxOption[]` | native select state | Gets or replaces selected options. |
| `defaultSelected` | - | `ListboxOption[] \| undefined` | `undefined` | Initial uncontrolled selected options, applied before host `selected` writes. |

### Methods

| Method | Description |
|---|---|
| `addSelected()` | Moves highlighted available options to the selected list. |
| `addAll()` | Moves every available option to the selected list. |
| `removeSelected()` | Moves highlighted selected options back to the available list. |
| `clearSelected()` | Moves every selected option back to the available list. |
| `moveSelected(delta)` | Reorders highlighted selected options by `-1` or `1` rows. |

### Events

| Event | Detail | Description |
|---|---|---|
| `rc-transfer-list-change` | `{ selected: ListboxOption[] }` | Fires after a user action changes the selected/right-hand list. |

Host property writes to `available`, `selected`, or `defaultSelected` are silent.

## Keyboard

The embedded `rc-listbox` controls provide list navigation and selection. The
transfer list also supports these shortcuts when focus is inside the component:

| Shortcut | Action |
|---|---|
| `Alt+ArrowRight` | Add highlighted available options. |
| `Alt+ArrowLeft` | Remove highlighted selected options. |
| `Alt+ArrowUp` | Move highlighted selected options up. |
| `Alt+ArrowDown` | Move highlighted selected options down. |
| `Enter` | Add the highlighted available option in single-select mode. |
| `Delete` | Remove highlighted selected options. |

## Styling Hooks

Panels expose `data-empty` when their backing list has no options and
`data-has-selection` when that panel currently has highlighted rows. The root
exposes `data-can-move-up` and `data-can-move-down` when the selected panel has
highlighted rows that can be reordered in that direction.

| CSS custom property | Default | Description |
|---|---|---|
| `--rc-transfer-list-gap` | `var(--rc-control-gap, 0.75rem)` | Gap between panels and the action toolbar. |
| `--rc-transfer-list-panel-gap` | `var(--rc-control-gap, 0.35rem)` | Gap between a panel label and its listbox. |
| `--rc-transfer-list-listbox-min-block-size` | `10rem` | Minimum block size for each listbox. |
| `--rc-transfer-list-listbox-border` | `var(--rc-border, 1px solid ButtonBorder)` | Border around each listbox. |
| `--rc-transfer-list-option-gap` | `var(--rc-item-gap, 0.4em)` | Gap between option adornments and labels. |
| `--rc-transfer-list-option-padding-block` | `var(--rc-item-padding-block, 0.3em)` | Block padding for option rows. |
| `--rc-transfer-list-option-padding-inline` | `var(--rc-item-padding-inline, 0.75em)` | Inline padding for option rows. |
| `--rc-transfer-list-option-selected-bg` | `var(--rc-highlight, Highlight)` | Selected option background. |
| `--rc-transfer-list-option-selected-color` | `var(--rc-highlight-text, HighlightText)` | Selected option foreground. |

| Part | Description |
|---|---|
| `root` | Root layout wrapper. |
| `panel` | Shared list panel surface. |
| `available-panel` | Available/left panel. |
| `selected-panel` | Selected/right panel. |
| `actions` | Transfer action toolbar. |
| `button` | Shared action button surface. |
