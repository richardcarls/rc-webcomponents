# `@rcarls/rc-menubar`

A WAI-ARIA compliant menubar component implementing the [Menubar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/). Manages roving tabindex across `rc-menu-button` triggers and cascades menu open/close as the user navigates. Built with [Lit 3](https://lit.dev).

---

## Installation

```bash
npm install @rcarls/rc-menubar
```

## Import

```js
import '@rcarls/rc-menubar';                        // side-effect: registers <rc-menubar>
import { RCMenubar } from '@rcarls/rc-menubar';     // named class export
```

`rc-menubar` depends on `rc-menu-button` and `rc-menu`. Ensure all three are installed.

---

## Basic usage

Place `rc-menu-button` elements as direct children. The menubar manages focus and opens the appropriate menu as the user navigates.

```html
<rc-menubar label="Application menu">
  <rc-menu-button>
    <button slot="trigger">File</button>
    <rc-menu label="File">
      <button>New</button>
      <button>Open…</button>
      <button>Save</button>
    </rc-menu>
  </rc-menu-button>

  <rc-menu-button>
    <button slot="trigger">Edit</button>
    <rc-menu label="Edit">
      <button>Undo</button>
      <button>Redo</button>
      <button>Cut</button>
      <button>Copy</button>
      <button>Paste</button>
    </rc-menu>
  </rc-menu-button>

  <rc-menu-button>
    <button slot="trigger">View</button>
    <rc-menu label="View">
      <button>Zoom In</button>
      <button>Zoom Out</button>
    </rc-menu>
  </rc-menu-button>
</rc-menubar>
```

---

## API

### Properties / attributes

| Property | Attribute | Type | Default | Description |
|---|---|---|---|---|
| `label` | `label` | `string` | `'Menu'` | `aria-label` for the menubar. Required — no visible label is rendered by the component. |
| `orientation` | `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction and keyboard navigation axis. Propagated to child `rc-menu-button` elements for arrow-key open direction. |

### CSS custom properties

| Property | Default | Description |
|---|---|---|
| `--rc-menubar-gap` | `0` | Gap between menu buttons |
| `--rc-menubar-padding-inline` | `0` | Horizontal padding on the menubar container |
| `--rc-menubar-padding-block` | `0` | Vertical padding on the menubar container |

### CSS parts

| Part | Element | Description |
|---|---|---|
| `root` | `div[role="menubar"]` | The inner menubar container |

### Slots

| Slot | Description |
|---|---|
| *(default)* | `rc-menu-button` elements. Non-menu-button elements are rendered but excluded from keyboard navigation. |

### Events

`rc-menubar` dispatches no events of its own. Listen for `rc-menu-button-toggle` and `rc-menu-activate` bubbling up from child components.

### Public methods

```ts
focusItem(item?: HTMLElement | null): void
  // Focus a specific trigger element.

closeActiveMenu(): void
  // Close the currently open menu without returning focus to the trigger.
```

### Read-only getters

```ts
items: HTMLElement[]           // All trigger elements across all child rc-menu-buttons
menuButtons: RCMenuButton[]    // All child rc-menu-button elements
firstItem: HTMLElement | undefined
lastItem: HTMLElement | undefined
nextItem: HTMLElement | undefined    // Relative to last-focused trigger
previousItem: HTMLElement | undefined
```

---

## Keyboard behaviour

Horizontal orientation (default):

| Key | Action |
|---|---|
| `ArrowRight` | Focus next trigger (wraps); if a menu is open, closes current and opens next |
| `ArrowLeft` | Focus previous trigger (wraps); if a menu is open, closes current and opens previous |
| `Home` | Focus first trigger |
| `End` | Focus last trigger |
| `Escape` | Close the active menu; focus remains on trigger |
| `Tab` | Leaves the menubar (standard tab order) |

For vertical orientation, `ArrowDown`/`ArrowUp` replace `ArrowRight`/`ArrowLeft`. The `rc-menu-button` children automatically inherit the menubar's orientation to determine their own open-axis arrow keys.

---

## ARIA

| Attribute | Where | Value |
|---|---|---|
| `role="menubar"` | Root `div` | — |
| `aria-orientation` | Root `div` | `"horizontal"` or `"vertical"` |
| `aria-label` | Root `div` | Value of `label` property |
| `tabindex="0"` | Active trigger | One trigger tabbable at a time (roving tabindex) |
| `tabindex="-1"` | All other triggers | Removed from tab order |

---

## Browser support

All modern browsers. Requires Web Components support (Chrome 67+, Firefox 63+, Safari 12.1+).
