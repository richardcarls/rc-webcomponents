# `@rcarls/rc-menu-button`

An implementation of the [WAI-ARIA Menu Button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/).

Wraps a trigger element and an `rc-menu` popup, wiring ARIA attributes, light-dismiss, and keyboard open/close automatically.

---

## Installation

```bash
npm install @rcarls/rc-menu-button
```

## Import

```js
import '@rcarls/rc-menu-button/define';                  // side-effect: registers <rc-menu-button>
import { RCMenuButton } from '@rcarls/rc-menu-button';   // named class export
```

`rc-menu-button` depends on `rc-menu`. Ensure both are installed.

---

## Basic usage

Place a trigger element in the `trigger` slot and an `rc-menu` in the default slot.

```html
<rc-menu-button>
  <button slot="trigger">File</button>

  <rc-menu label="File">
    <button>New</button>
    <button>Open…</button>
    <button>Save</button>
  </rc-menu>
</rc-menu-button>
```

The component automatically sets `aria-haspopup="menu"` and `aria-expanded` on the trigger, and closes the menu when the user clicks outside or selects an item.

---

## API

### Properties / attributes

| Property | Attribute | Type | Default | Description |
|---|---|---|---|---|
| `open` | `open` | `boolean` | `false` | Whether the menu popup is visible. Reflects to attribute. |
| `orientation` | `orientation` | `'horizontal' \| 'vertical' \| undefined` | `undefined` | Arrow-key axis for opening the menu. When unset, inherited from a parent `rc-menubar` or `[role="menubar"]` element. Falls back to `'horizontal'`. |

### CSS custom properties

| Property | Default | Description |
|---|---|---|
| `--rc-menu-button-trigger-block-size` | `var(--rc-control-block-size)` | Minimum block size of the trigger |
| `--rc-menu-button-trigger-padding-block` | `var(--rc-control-padding-block)` | Trigger block-axis padding |
| `--rc-menu-button-trigger-padding-inline` | `var(--rc-control-padding-inline)` | Trigger inline-axis padding |
| `--rc-menu-button-trigger-gap` | `var(--rc-item-gap)` | Gap between flex children inside the trigger |
| `--rc-menu-button-trigger-border` | `var(--rc-border)` | Trigger border |
| `--rc-menu-button-trigger-radius` | `var(--rc-control-radius)` | Trigger border radius |
| `--rc-menu-button-trigger-background` | `var(--rc-button-bg)` | Trigger background |
| `--rc-menu-button-trigger-color` | `var(--rc-button-text)` | Trigger text color |
| `--rc-menu-button-trigger-transition` | — | Trigger state transition |
| `--rc-menu-button-trigger-hover-background` | `color-mix(in srgb, Highlight 8%, transparent)` | Trigger hover background |
| `--rc-menu-button-trigger-hover-color` | `inherit` | Trigger hover text color |
| `--rc-menu-button-trigger-hover-border-color` | `currentColor` | Trigger hover border color |
| `--rc-menu-button-trigger-open-background` | `color-mix(in srgb, Highlight 12%, transparent)` | Trigger background while the menu is open |
| `--rc-menu-button-trigger-open-color` | `inherit` | Trigger text color while the menu is open |
| `--rc-menu-button-trigger-open-border-color` | `currentColor` | Trigger border color while the menu is open |
| `--rc-menu-button-popup-z-index` | `1000` | `z-index` of the popup container |

### CSS parts

| Part | Element | Description |
|---|---|---|
| `root` | Outer `div` | Root wrapper |
| `popup` | Popup `div` | Container that shows/hides around the slotted `rc-menu` |

### Slots

| Slot | Description |
|---|---|
| `trigger` | The button (or other interactive element) that toggles the menu. Receives `aria-haspopup` and `aria-expanded` automatically. |
| *(default)* | The `rc-menu` to show as the popup. |

### Events

| Event | Bubbles | Cancelable | Detail | When |
|---|---|---|---|---|
| `rc-menu-button-toggle` | Yes (composed) | No | `{ open: boolean }` | Menu opens or closes |

### Public methods

```ts
openMenu(focusTarget?: 'first' | 'last'): void
  // Open the menu. Focuses the first or last item after render.

closeMenu(returnFocus?: boolean): void
  // Close the menu. If returnFocus is true (default), restores focus to the trigger.

toggleMenu(): void
  // Toggle open/closed.
```

---

## Keyboard behaviour

Keyboard handling depends on the resolved `orientation` (horizontal by default, or inherited from a parent menubar).

| Key | Condition | Action |
|---|---|---|
| `ArrowDown` | Horizontal orientation | Open menu, focus first item |
| `ArrowUp` | Horizontal orientation | Open menu, focus last item |
| `ArrowRight` | Vertical orientation | Open menu, focus first item |
| `ArrowLeft` | Vertical orientation | Open menu, focus last item |
| `Enter` / `Space` | Menu closed | Open menu |
| `Enter` / `Space` | Menu open | Activate focused item, close menu |
| `Escape` | Menu open | Close menu, return focus to trigger |

---

## ARIA

| Attribute | Where | Value |
|---|---|---|
| `aria-haspopup="menu"` | Trigger element | Set automatically on slot change |
| `aria-expanded` | Trigger element | `"true"` / `"false"`, kept in sync with `open` |
| `open` | Host element | Reflected boolean attribute when menu is open |

---

## Notes

**Popup positioning** uses `AnchorController`, with native CSS Anchor
Positioning when available and a viewport-aware fallback otherwise. Set the
`placement` property or attribute to choose the preferred direction.

**Light dismiss** is active at all times. A capture-phase `click` listener on `document` closes the menu whenever the click falls outside the component boundary (checked via `composedPath()`).

---

## Browser support

All modern browsers. Requires Web Components support (Chrome 67+, Firefox 63+, Safari 12.1+).
