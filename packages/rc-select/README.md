# `@rcarls/rc-select`

Select-only combobox backed by a native `<select>`, following the [WAI-ARIA Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-select](https://richardcarls.github.io/rc-webcomponents/components/rc-select).

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
    <select name="fruit">
      <option value="">Choose fruit</option>
      <option value="apple">Apple</option>
      <option value="banana">Banana</option>
      <option value="cherry" disabled>Cherry</option>
    </select>
  </rc-select>
</label>
```

## Dialog popup

Set `popup-mode="dialog"` when an anchored listbox would leave too little usable viewport. The
component manages a fullscreen native dialog with a leading close action, title, current chips,
option list, and trailing Done action.

Dialog selection is transactional: option and chip changes are staged until Done is activated.
Done updates the native `<select>` and fires one `rc-select-change`; the leading close action,
Escape, and imperative close discard the staged changes.

```html
<rc-select popup-mode="dialog" placeholder="Choose categories" multiple>
  <select name="categories" multiple>
    <option value="quick">Quick meal</option>
    <option value="vegetarian">Vegetarian</option>
  </select>
</rc-select>
```

## API

| Property / method          | Type                             | Description                                               |
| -------------------------- | -------------------------------- | --------------------------------------------------------- |
| `open`                     | `boolean`                        | Current popup state.                                      |
| `multiple`                 | `boolean`                        | Mirrors the slotted `<select multiple>` state.            |
| `disabled`                 | `boolean`                        | Mirrors the slotted `<select disabled>` state.            |
| `placeholder`              | `string`                         | Text shown when no value is selected.                     |
| `display`                  | `'auto' \| 'chips' \| 'compact'` | Controls multi-select display.                            |
| `popupMode`                | `'popover' \| 'dialog'`          | Chooses anchored or transactional dialog presentation.    |
| `dialogConfirmLabel`       | `string`                         | Dialog commit action label. Defaults to `Done`.           |
| `dialogCancelLabel`        | `string`                         | Accessible label for the leading close action.            |
| `dialogCancelButton`       | `'visible' \| 'hidden'`          | Shows or hides the leading close action.                  |
| `value`                    | `string \| string[]`             | Controlled selection. Programmatic writes apply silently. |
| `openPopup()`              | `void`                           | Opens the listbox popover.                                |
| `closePopup(returnFocus?)` | `void`                           | Closes the listbox and optionally restores focus.         |

## Events

| Event              | Detail                          | Description                   |
| ------------------ | ------------------------------- | ----------------------------- |
| `rc-select-change` | `{ value: string \| string[] }` | Fires when selection changes. |
| `rc-select-open`   | none                            | Fires when the popup opens.   |
| `rc-select-close`  | none                            | Fires when the popup closes.  |

## Accessibility

- Trigger uses `role="combobox"`, `aria-haspopup="listbox"`, and
  `aria-activedescendant`.
- The popup uses `rc-listbox` for `role="listbox"` and option state.
- Accessible name is copied from the slotted select label or `aria-label` unless
  the trigger has an explicit label.
