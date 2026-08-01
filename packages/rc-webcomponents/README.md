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
  RCButton,
  RCCard,
  RCCombobox,
  RCDialog,
  RCFabMenu,
  RCListbox,
  RcMarkdownEditor,
  RCMenu,
  RCMenuButton,
  RCMenubar,
  RCNavigationBar,
  RCNavigationRail,
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

| Package              | Purpose                                                              |
| -------------------- | -------------------------------------------------------------------- |
| `rc-app-bar`         | App bar modeled after Material 3 Top app bar.                        |
| `rc-accordion`       | Accordion coordinator for native `<details>` panels.                 |
| `rc-bottom-sheet`    | Modal bottom-sheet wrapper for a native `<dialog>`.                  |
| `rc-button`          | Progressive-enhancement wrapper for native `<button>`.               |
| `rc-card`            | Design-system-neutral structural card shell.                         |
| `rc-chip`            | Chip wrapper that preserves a native `<button>`.                     |
| `rc-combobox`        | Editable combobox with filtering and optional allow-create behavior. |
| `rc-dialog`          | Draggable, resizable wrapper for a native `<dialog>`.                |
| `rc-disclosure`      | Disclosure wrapper for native `<details>`/`<summary>`.               |
| `rc-fab`             | Sticky floating action button modeled after Material 3 FAB.          |
| `rc-fab-menu`        | Floating action button menu wrapper for an `rc-menu` action surface. |
| `rc-listbox`         | Listbox that keeps option DOM in light DOM.                          |
| `rc-markdown-editor` | Rich/source Markdown editor backed by `rc-textarea`.                 |
| `rc-menu`            | Menu popup for command surfaces.                                     |
| `rc-menu-button`     | Trigger button that opens an `rc-menu` popup.                        |
| `rc-menubar`         | Menubar coordinator for `rc-menu-button` children.                   |
| `rc-navigation-bar`  | Bottom navigation layout that styles consumer-authored links.        |
| `rc-navigation-rail` | Navigation rail landmark that styles consumer-authored links.        |
| `rc-range-slider`    | Two-thumb range slider backed by native range inputs.                |
| `rc-search-bar`      | Search field/view wrapper for native `<input type="search">`.        |
| `rc-segmented-button` | Segmented radio group enhancer for native radios in a `<fieldset>`. |
| `rc-select`          | Select-only combobox backed by a native `<select>`.                  |
| `rc-slider`          | Single-thumb slider backed by native `<input type="range">`.         |
| `rc-snackbar`        | Live-region status-message host with queueing and optional action.   |
| `rc-splitter`        | Resizable pane splitter with pointer and keyboard controls.          |
| `rc-switch`          | Switch wrapper that enhances a native checkbox input.                |
| `rc-textarea`        | Textarea wrapper with line decorations and plugin hooks.             |
| `rc-toolbar`         | Toolbar that groups controls into one tab stop.                      |
| `rc-transfer-list`   | Transfer list enhancing native `<select multiple>`.                  |
| `rc-virtual-canvas`  | Scrollable virtual canvas for large coordinate-space content.        |

## Notes

- Use individual packages when bundle size matters and the app only needs one or
  two components.
- Use this aggregate package for app-level convenience, framework integration,
  and demo/documentation surfaces.
