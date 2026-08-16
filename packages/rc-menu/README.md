# `@rcarls/rc-menu`

Menu popup for command surfaces with keyboard navigation and typed activation
events, following the
[WAI-ARIA Menu pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu/).

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-menu](https://richardcarls.github.io/rc-webcomponents/components/rc-menu).

---

## Installation

```bash
npm install @rcarls/rc-menu
```

## Import

```js
import '@rcarls/rc-menu/define';
import { RCMenu } from '@rcarls/rc-menu';
```

The `define` entry point registers `<rc-menu>`. The package root exports the
class without registering the custom element.

---

## Basic usage

Slot any focusable elements as menu items. Non-focusable elements (separators,
headings) are rendered but excluded from keyboard navigation.

```html
<rc-menu label="File">
  <button type="button" value="new">New</button>
  <button type="button" value="open">Open…</button>
  <hr />
  <button type="button" disabled>Save</button>
  <button type="button" value="save-as">Save As…</button>
</rc-menu>
```

For a cascading item, use an [`rc-menu-button`](../rc-menu-button/README.md)
and provide its visual affordance through the `indicator` slot. `rc-menu` does
not generate an indicator glyph, so applications and themes retain control of
iconography and writing-direction behavior.

`rc-menu` is typically used inside an
[`rc-menu-button`](../rc-menu-button/README.md) or
[`rc-menubar`](../rc-menubar/README.md), which handle positioning and trigger
wiring. It can also be used standalone as a context menu.

## Interaction model

DOM focus remains on the `rc-menu` host. Arrow keys, Home, and End move a
virtual cursor exposed through `aria-activedescendant`; slotted menu items keep
`tabindex="-1"`. The `focusFirst()`, `focusLast()`, `focusItem()`, and
`focusItemAt()` methods use the same model: they focus the host and select an
active item without moving DOM focus into that item.

Direct focusable children become `role="menuitem"` entries unless they already
use `menuitemcheckbox` or `menuitemradio`. A labeled `role="group"` may contain
one level of related items. Checkbox and radio items maintain `aria-checked`,
while `<hr>` and `role="separator"` elements remain outside navigation.

## Events

Both events bubble across shadow boundaries and are not cancelable.

| Event              | Detail                            | When                                                       |
| ------------------ | --------------------------------- | ---------------------------------------------------------- |
| `rc-menu-activate` | `{ item, value, text, checked? }` | Enter, Space, or a pointer click activates an enabled item |
| `rc-menu-close`    | `{ reason: 'escape' }`            | Escape requests that the containing popup close            |

`value` comes from `data-value` or `value`, `text` is the item's trimmed text
content, and `checked` reports the resulting checkbox or radio state.

## Styling

Menu items remain in light DOM. `rc-menu` injects their structural base styles
once per containing document or shadow root under `@layer rc-base`; inherited
`--rc-menu-*` custom properties customize the host and rows. The component does
not expose CSS parts. Add keyboard hints with `[data-menu-shortcut]`, and provide
nested-menu indicators through `rc-menu-button`'s `indicator` slot.

See the [component docs](https://richardcarls.github.io/rc-webcomponents/components/rc-menu)
for the generated API reference, including attributes, methods, slots, events,
and CSS custom properties.
