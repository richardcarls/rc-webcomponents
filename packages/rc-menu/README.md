# `@rcarls/rc-menu`

Menu popup for command surfaces with keyboard navigation and typed activation events, following the [WAI-ARIA Menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu/).

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-menu](https://richardcarls.github.io/rc-webcomponents/components/rc-menu).

---

## Installation

```bash
npm install @rcarls/rc-menu
```

## Import

```js
import '@rcarls/rc-menu';                    // side-effect: registers <rc-menu>
import { RCMenu } from '@rcarls/rc-menu';    // named class export
```

---

## Basic usage

Slot any focusable elements as menu items. Non-focusable elements (separators, headings) are rendered but excluded from keyboard navigation.

```html
<rc-menu label="File">
  <button>New</button>
  <button>Open…</button>
  <hr aria-hidden="true" />
  <button disabled>Save</button>
  <button>Save As…</button>
</rc-menu>
```

`rc-menu` is typically used inside an [`rc-menu-button`](../rc-menu-button/README.md) or [`rc-menubar`](../rc-menubar/README.md), which handle positioning and trigger wiring. It can also be used standalone as a context menu.

---

## API

### Properties / attributes

| Property | Attribute | Type | Default | Description |
|---|---|---|---|---|
| `label` | `label` | `string` | `''` | Value of the `aria-label` on the menu container. Required for accessibility when no visible label is present. |

### CSS custom properties

| Property | Default | Description |
|---|---|---|
| `--rc-menu-min-width` | `10em` | Minimum width of the menu container |
| `--rc-menu-padding-block` | `0.25em` | Block-axis (top/bottom) padding inside the root |
| `--rc-menu-background` | `Canvas` | Menu background color (system color keyword) |
| `--rc-menu-border` | `1px solid ButtonBorder` | Menu border |
| `--rc-menu-shadow` | `0 2px 8px rgba(0,0,0,0.15)` | Box shadow |

### CSS parts

| Part | Element | Description |
|---|---|---|
| `root` | `div[role="menu"]` | The inner menu container |

### Slots

| Slot | Description |
|---|---|
| *(default)* | Menu items. Only focusable elements participate in keyboard navigation. `<button>`, `<a href>`, elements with `tabindex`, and `<input>`/`<select>`/`<textarea>` are recognised as focusable; all others are skipped. |

### Events

| Event | Bubbles | Cancelable | Detail | When |
|---|---|---|---|---|
| `rc-menu-activate` | Yes (composed) | No | `{ item: HTMLElement }` | User presses Enter or Space on a focused item |
| `rc-menu-close` | Yes (composed) | No | — | User presses Escape |

### Public methods

```ts
focusFirst(): void            // Focus the first navigable item
focusLast(): void             // Focus the last navigable item
focusItem(item: HTMLElement): void     // Focus a specific item
focusItemAt(index: number): void       // Focus item at zero-based index
```

### Read-only getters

```ts
items: HTMLElement[]          // All currently navigable (focusable) slotted items
firstItem: HTMLElement | undefined
lastItem: HTMLElement | undefined
nextItem: HTMLElement | undefined    // Relative to the currently focused item
previousItem: HTMLElement | undefined
```

---

## Keyboard behaviour

| Key | Action |
|---|---|
| `ArrowDown` | Focus next item (wraps) |
| `ArrowUp` | Focus previous item (wraps) |
| `Home` | Focus first item |
| `End` | Focus last item |
| `Enter` / `Space` | Activate focused item (fires `rc-menu-activate`) |
| `Escape` | Fire `rc-menu-close` |

---

## ARIA

| Attribute | Where | Value |
|---|---|---|
| `role="menu"` | Root `div` | — |
| `aria-label` | Root `div` | Value of `label` property |
| `role="menuitem"` | Each slotted focusable item | Set dynamically on slot change |
| `tabindex="0"` | Active item | One item is tabbable at a time (roving tabindex) |
| `tabindex="-1"` | All other items | Removed from tab order |

---

## Browser support

All modern browsers. Requires Web Components support (Chrome 67+, Firefox 63+, Safari 12.1+).
