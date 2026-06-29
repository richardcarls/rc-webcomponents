# `@rcarls/rc-toolbar`

Toolbar that groups consumer-supplied controls into one tab stop with arrow-key navigation, following the [WAI-ARIA Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/).

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-toolbar](https://richardcarls.github.io/rc-webcomponents/components/rc-toolbar).

---

## Installation

```bash
npm install @rcarls/rc-toolbar
```

## Import

```js
import '@rcarls/rc-toolbar';                        // side-effect: registers <rc-toolbar>
import { RCToolbar } from '@rcarls/rc-toolbar';     // named class export
```

---

## Basic usage

Place buttons, toggles, selects, or any focusable controls as direct children. Non-focusable elements (separators, labels) are rendered but skipped during keyboard navigation.

```html
<rc-toolbar label="Formatting">
  <button onclick="bold()">Bold</button>
  <button onclick="italic()">Italic</button>
  <button onclick="underline()">Underline</button>
  <hr aria-hidden="true" />
  <button onclick="alignLeft()">Align left</button>
  <button onclick="alignCenter()">Align center</button>
  <button onclick="alignRight()">Align right</button>
</rc-toolbar>
```

Vertical orientation:

```html
<rc-toolbar orientation="vertical" label="Actions">
  <button>Cut</button>
  <button>Copy</button>
  <button>Paste</button>
</rc-toolbar>
```

---

## API

### Properties / attributes

| Property | Attribute | Type | Default | Description |
| --- | --- | --- | --- | --- |
| `label` | `label` | `string` | `'Toolbar'` | `aria-label` for the toolbar. Required — no visible label is rendered by the component. |
| `orientation` | `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction and keyboard navigation axis. |

### CSS custom properties

| Property | Default | Description |
| --- | --- | --- |
| `--rc-toolbar-gap-inline` | `0.25em` | Gap between toolbar items |
| `--rc-toolbar-padding-inline` | `0.25em` | Horizontal padding on the toolbar container |
| `--rc-toolbar-padding-block` | `0.125em` | Vertical padding on the toolbar container |
| `--rc-toolbar-radius` | `var(--rc-control-radius)` | Toolbar container border radius |
| `--rc-toolbar-vertical-radius` | `var(--rc-toolbar-radius)` | Border radius override for vertical orientation |

### CSS parts

| Part | Element | Description |
| --- | --- | --- |
| `root` | `div[role="toolbar"]` | The toolbar container element |

### Slots

| Slot | Description |
| --- | --- |
| *(default)* | Toolbar controls. Focusable elements (`<button>`, `<input>`, `<select>`, `<a href>`, elements with `tabindex`) participate in roving-tabindex navigation. All others are rendered but skipped. |

### Events

`rc-toolbar` dispatches no custom events. Listen for standard events (`click`, `change`, etc.) on slotted children.

### Public methods

```ts
focusItem(item?: HTMLElement | null): void
  // Focus a specific toolbar item programmatically.

focusItemAt(index: number): void
  // Focus the item at zero-based index.
```

### Read-only getters

```ts
items: HTMLElement[]           // All currently navigable (focusable) slotted items
firstItem: HTMLElement | undefined
lastItem: HTMLElement | undefined
nextItem: HTMLElement | undefined    // Relative to the currently focused item
previousItem: HTMLElement | undefined
```

---

## Keyboard behaviour

The toolbar is a single tab stop. Arrow keys navigate within it.

| Key | Orientation | Action |
| --- | --- | --- |
| `ArrowRight` | Horizontal | Focus next item (wraps) |
| `ArrowLeft` | Horizontal | Focus previous item (wraps) |
| `ArrowDown` | Vertical | Focus next item (wraps) |
| `ArrowUp` | Vertical | Focus previous item (wraps) |
| `Home` | Both | Focus first item |
| `End` | Both | Focus last item |
| `Tab` | Both | Leave toolbar (standard tab order) |

---

## ARIA

| Attribute | Where | Value |
| --- | --- | --- |
| `role="toolbar"` | Root `div` | — |
| `aria-orientation` | Root `div` | `"horizontal"` or `"vertical"` |
| `aria-label` | Root `div` | Value of `label` property |
| `tabindex="0"` | Active item | One item tabbable at a time (roving tabindex) |
| `tabindex="-1"` | All other items | Removed from tab order |

---

## Browser support

All modern browsers. Requires Web Components support (Chrome 67+, Firefox 63+, Safari 12.1+).
