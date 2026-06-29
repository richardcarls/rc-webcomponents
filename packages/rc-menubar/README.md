# `@rcarls/rc-menubar`

Menubar coordinator for `rc-menu-button` children with roving tabindex and submenu handoff, following the [WAI-ARIA Menubar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/).

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-menubar](https://richardcarls.github.io/rc-webcomponents/components/rc-menubar).

Manages roving tabindex across `rc-menu-button` triggers and cascades menu open/close as the user navigates. Built with [Lit 3](https://lit.dev).

---

## Installation

```bash
npm install @rcarls/rc-menubar
```

## Import

```js
import '@rcarls/rc-menubar/define';                 // side-effect: registers <rc-menubar>
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
| `--rc-menubar-gap` | `var(--rc-control-gap)` | Gap between menu buttons |
| `--rc-menubar-padding-inline` | `var(--rc-control-padding-inline)` | Inline padding on the menubar container |
| `--rc-menubar-padding-block` | `var(--rc-control-padding-block)` | Block padding on the menubar container |
| `--rc-menubar-border` | `var(--rc-border)` | Menubar container border |
| `--rc-menubar-radius` | `var(--rc-control-radius)` | Menubar container border radius |
| `--rc-menubar-background` | `Canvas` | Menubar container background |
| `--rc-menubar-color` | `CanvasText` | Menubar container text color |
| `--rc-menubar-item-block-size` | `2.25em` | Minimum block size for child menu-button triggers |
| `--rc-menubar-item-padding-block` | `0.25em` | Child trigger block-axis padding |
| `--rc-menubar-item-padding-inline` | `0.75em` | Child trigger inline-axis padding |
| `--rc-menubar-item-gap` | `var(--rc-item-gap)` | Gap between flex children inside child triggers |
| `--rc-menubar-item-border` | `1px solid transparent` | Child trigger border |
| `--rc-menubar-item-radius` | `var(--rc-control-radius)` | Child trigger border radius |
| `--rc-menubar-item-background` | `transparent` | Child trigger background |
| `--rc-menubar-item-color` | `inherit` | Child trigger text color |
| `--rc-menubar-item-transition` | — | Child trigger state transition |
| `--rc-menubar-item-hover-background` | `color-mix(in srgb, Highlight 8%, transparent)` | Child trigger hover background |
| `--rc-menubar-item-hover-color` | `inherit` | Child trigger hover text color |
| `--rc-menubar-item-hover-border-color` | `transparent` | Child trigger hover border color |
| `--rc-menubar-item-open-background` | `color-mix(in srgb, Highlight 12%, transparent)` | Child trigger background while its menu is open |
| `--rc-menubar-item-open-color` | `inherit` | Child trigger text color while its menu is open |
| `--rc-menubar-item-open-border-color` | `transparent` | Child trigger border color while its menu is open |

### CSS parts

| Part | Element | Description |
|---|---|---|
| `root` | Inner `div` | The visual menubar container |

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
| `role="menubar"` | Host element | — |
| `aria-orientation` | Host element | `"horizontal"` or `"vertical"` |
| `aria-label` | Host element | Value of `label` property |
| `tabindex="0"` | Active trigger | One trigger tabbable at a time (roving tabindex) |
| `tabindex="-1"` | All other triggers | Removed from tab order |

---

## Browser support

All modern browsers. Requires Web Components support (Chrome 67+, Firefox 63+, Safari 12.1+).
