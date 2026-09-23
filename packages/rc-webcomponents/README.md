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

## Import Components

The recommended syntax uses one aggregate-package subpath per component. This
registers only the elements you import:

```ts
import '@rcarls/rc-webcomponents/rc-button/define';
import '@rcarls/rc-webcomponents/rc-dialog/define';
```

The subpath is the package name, so these are interchangeable with the
standalone packages and bundle to the same output:

```ts
import '@rcarls/rc-button/define';
```

## Import All Definitions

Registers every element in the collection. Prefer the per-component entries
above unless you use most of the library:

```ts
import '@rcarls/rc-webcomponents/define';
```

## Import Classes

```ts
import { RCButton } from '@rcarls/rc-webcomponents/rc-button';
import { RCDialog } from '@rcarls/rc-webcomponents/rc-dialog';
```

Class subpaths do not register custom elements. Import the matching `/define`
subpath when you want registration as a side effect.

## Base Theme Tokens

The optional base theme defines shared semantic tokens with CSS System Color
fallbacks:

```css
@import '@rcarls/rc-webcomponents/themes/base.css';
```

## Included Packages

| Package               | Purpose                                                              |
| --------------------- | -------------------------------------------------------------------- |
| `rc-app-bar`          | App bar modeled after Material 3 Top app bar.                        |
| `rc-accordion`        | Accordion coordinator for native `<details>` panels.                 |
| `rc-bottom-sheet`     | Modal bottom-sheet wrapper for a native `<dialog>`.                  |
| `rc-button`           | Progressive-enhancement wrapper for native buttons or anchors.       |
| `rc-card`             | Design-system-neutral structural card shell.                         |
| `rc-chip`             | Chip wrapper for native actions, links, filters, and inputs.         |
| `rc-combobox`         | Editable combobox with filtering and optional allow-create behavior. |
| `rc-dialog`           | Draggable, resizable wrapper for a native `<dialog>`.                |
| `rc-disclosure`       | Disclosure wrapper for native `<details>`/`<summary>`.               |
| `rc-fab`              | Sticky floating action button modeled after Material 3 FAB.          |
| `rc-fab-menu`         | Floating action button menu wrapper for an `rc-menu` action surface. |
| `rc-list`             | Shared-column standard and segmented list rows.                      |
| `rc-listbox`          | Listbox that keeps option DOM in light DOM.                          |
| `rc-markdown-editor`  | Rich/source Markdown editor backed by `rc-textarea`.                 |
| `rc-menu`             | Menu popup for command surfaces.                                     |
| `rc-menu-button`      | Trigger button that opens an `rc-menu` popup.                        |
| `rc-menubar`          | Menubar coordinator for `rc-menu-button` children.                   |
| `rc-navigation-bar`   | Bottom navigation layout that styles consumer-authored links.        |
| `rc-navigation-rail`  | Navigation rail layout that styles consumer-authored links.          |
| `rc-range-slider`     | Two-thumb range slider backed by native range inputs.                |
| `rc-search-bar`       | Search field/view wrapper for native `<input type="search">`.        |
| `rc-scroller`         | Native scroll region with optional content/fullbleed layout.         |
| `rc-segmented-button` | Segmented radio group enhancer for native radios in a `<fieldset>`.  |
| `rc-select`           | Select-only combobox backed by a native `<select>`.                  |
| `rc-slider`           | Single-thumb slider backed by native `<input type="range">`.         |
| `rc-snackbar`         | Live-region status-message host with queueing and optional action.   |
| `rc-splitter`         | Resizable pane splitter with pointer and keyboard controls.          |
| `rc-switch`           | Switch wrapper that enhances a native checkbox input.                |
| `rc-textarea`         | Textarea wrapper with line decorations and plugin hooks.             |
| `rc-toolbar`          | Toolbar that groups controls into one tab stop.                      |
| `rc-transfer-list`    | Transfer list enhancing native `<select multiple>`.                  |
| `rc-virtual-canvas`   | Scrollable virtual canvas for large coordinate-space content.        |

## Notes

- Bundle size no longer decides this. A per-component subpath here re-exports
  the standalone package, so the two bundle identically, and either way you
  write one import per component you use.
- Use this aggregate package for one dependency to install and upgrade. The
  collection is released as a version-locked set, so the components move
  together regardless.
- Use individual packages to install only what you use or to pin components
  separately, at the cost of a manifest entry per component.
- Only `@rcarls/rc-webcomponents/define` pulls in the whole collection.
