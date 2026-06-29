# `@rcarls/rc-webcomponents`

Aggregate package that re-exports and defines the `rc-webcomponents` collection.

Docs: [https://richardcarls.github.io/rc-webcomponents/](https://richardcarls.github.io/rc-webcomponents/).

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
| `rc-app-bar` | App bar modeled after Material 3 Top app bar. |
| `rc-accordion` | Accordion coordinator for native `<details>` panels. |
| `rc-combobox` | Editable combobox with filtering and optional allow-create behavior. |
| `rc-dialog` | Draggable, resizable wrapper for a native `<dialog>`. |
| `rc-disclosure` | Disclosure wrapper for native `<details>`/`<summary>`. |
| `rc-fab` | Sticky floating action button modeled after Material 3 FAB. |
| `rc-listbox` | Listbox that keeps option DOM in light DOM. |
| `rc-markdown-editor` | Rich/source Markdown editor backed by `rc-textarea`. |
| `rc-menu` | Menu popup for command surfaces. |
| `rc-menu-button` | Trigger button that opens an `rc-menu` popup. |
| `rc-menubar` | Menubar coordinator for `rc-menu-button` children. |
| `rc-range-slider` | Two-thumb range slider backed by native range inputs. |
| `rc-search-bar` | Search field wrapper for native `<input type="search">`. |
| `rc-select` | Select-only combobox backed by a native `<select>`. |
| `rc-slider` | Single-thumb slider backed by native `<input type="range">`. |
| `rc-splitter` | Resizable pane splitter with pointer and keyboard controls. |
| `rc-textarea` | Textarea wrapper with line decorations and plugin hooks. |
| `rc-toolbar` | Toolbar that groups controls into one tab stop. |
| `rc-transfer-list` | Transfer list enhancing native `<select multiple>`. |
| `rc-virtual-canvas` | Scrollable virtual canvas for large coordinate-space content. |

## Notes

- Use individual packages when bundle size matters and the app only needs one or
  two components.
- Use this aggregate package for app-level convenience, framework integration,
  and demo/documentation surfaces.
