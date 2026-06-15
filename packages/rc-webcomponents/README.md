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
  RcMarkdownEditor,
  RCMenu,
  RCMenuButton,
  RCMenubar,
  RCSelect,
  RCSplitter,
  RCTextarea,
  RCToolbar,
  RCVirtualCanvas,
} from '@rcarls/rc-webcomponents';
```

## Base Theme Tokens

The optional base theme defines shared semantic tokens with CSS System Color
fallbacks:

```css
@import '@rcarls/rc-webcomponents/themes/base.css';
```

## Included Packages

| Package | Purpose |
| --- | --- |
| `rc-app-bar` | Headless app bar with exact-center composition and scroll behaviors. |
| `rc-accordion` | Accordion coordinator for disclosure groups. |
| `rc-combobox` | Editable ARIA combobox. |
| `rc-dialog` | Native `<dialog>` enhancement wrapper. |
| `rc-disclosure` | Native disclosure enhancement wrapper. |
| `rc-fab` | Floating action button. |
| `rc-listbox` | Light-DOM ARIA listbox. |
| `rc-markdown-editor` | Rich/source Markdown editor. |
| `rc-menu` | ARIA menu popup. |
| `rc-menu-button` | Trigger button for ARIA menus. |
| `rc-menubar` | ARIA menubar controller. |
| `rc-range-slider` | Two-thumb range slider. |
| `rc-search-bar` | Native search-input enhancement. |
| `rc-select` | Select-only ARIA combobox. |
| `rc-slider` | Native range-input enhancement. |
| `rc-splitter` | Resizable splitter panes. |
| `rc-textarea` | Enhanced plain-text editor. |
| `rc-toolbar` | ARIA toolbar with roving tabindex. |
| `rc-transfer-list` | Native-select-backed transfer list. |
| `rc-virtual-canvas` | Virtualized canvas for large datasets. |

## Notes

- Use individual packages when bundle size matters and the app only needs one or
  two components.
- Use this aggregate package for app-level convenience, framework integration,
  and demo/documentation surfaces.
