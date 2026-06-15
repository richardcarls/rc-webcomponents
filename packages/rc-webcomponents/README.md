# `@rcarls/rc-webcomponents`

Aggregate package for the `@rcarls` web component collection. Import this package
when an application wants one dependency that re-exports the component classes
and can define every custom element at once.

## Installation

PowerShell:

```powershell
yarn.cmd add @rcarls/rc-webcomponents
```

Bash/zsh:

```bash
yarn add @rcarls/rc-webcomponents
```

## Import All Definitions

```ts
import '@rcarls/rc-webcomponents/define';
```

## Import Classes

```ts
import {
  RCCombobox,
  RCDialog,
  RCListbox,
  RCMenu,
  RCMenuButton,
  RCMenubar,
  RCSelect,
  RCSplitter,
  RCTextarea,
  RCToolbar,
} from '@rcarls/rc-webcomponents';
```

## Included Packages

| Package | Purpose |
| --- | --- |
| `rc-app-bar` | Headless app bar with exact-center composition and scroll behaviors. |
| `rc-combobox` | Editable ARIA combobox. |
| `rc-dialog` | Native `<dialog>` enhancement wrapper. |
| `rc-listbox` | Light-DOM ARIA listbox. |
| `rc-menu` | ARIA menu popup. |
| `rc-menu-button` | Trigger button for ARIA menus. |
| `rc-menubar` | ARIA menubar controller. |
| `rc-select` | Select-only ARIA combobox. |
| `rc-splitter` | Resizable splitter panes. |
| `rc-textarea` | Enhanced plain-text editor. |
| `rc-toolbar` | ARIA toolbar with roving tabindex. |

## Notes

- Use individual packages when bundle size matters and the app only needs one or
  two components.
- Use this aggregate package for app-level convenience, framework integration,
  and demo/documentation surfaces.
