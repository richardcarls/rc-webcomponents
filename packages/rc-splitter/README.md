# `@rcarls/rc-splitter`

Resizable pane splitter with pointer, keyboard, and collapse/restore controls that follows the
[WAI-ARIA Window Splitter pattern](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/).

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-splitter](https://richardcarls.github.io/rc-webcomponents/components/rc-splitter).

---

## Installation

```bash
npm install @rcarls/rc-splitter
```

## Import

```js
import '@rcarls/rc-splitter'; // side-effect: registers <rc-splitter>
import { RCSplitter } from '@rcarls/rc-splitter'; // named class export
```

---

## Basic usage

Place the primary pane in the default slot and the secondary pane in the `secondary` slot. The
splitter takes up all available space in its container.

```html
<rc-splitter style="width: 100%; height: 400px;">
  <div>Primary pane; resizes when you drag the separator</div>
  <div slot="secondary">Secondary pane; fills remaining space</div>
</rc-splitter>
```

Vertical orientation:

```html
<rc-splitter orientation="vertical" style="width: 100%; height: 600px;">
  <div>Top pane</div>
  <div slot="secondary">Bottom pane</div>
</rc-splitter>
```

---

## API

### Properties / attributes

| Property        | Attribute        | Type                               | Default        | Description                                                                                                                                                                                       |
| --------------- | ---------------- | ---------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`         | `label`          | `string`                           | `'Splitter'`   | Accessible label applied to the primary pane and used by the separator handle via `aria-labelledby`.                                                                                              |
| `orientation`   | `orientation`    | `'horizontal' \| 'vertical'`       | `'horizontal'` | Layout direction. `horizontal` = left/right panes; `vertical` = top/bottom panes. Reflects to attribute.                                                                                          |
| `mode`          | `mode`           | `'length' \| 'percent' \| 'fixed'` | `'length'`     | Unit and sizing behavior for `value`. `length` = pixels of the primary pane; `percent` = percentage of total container size; `fixed` = clampable px primary pane while the secondary pane flexes. |
| `step`          | `step`           | `number`                           | `1`            | Keyboard step size in the current unit (px or %). Shift multiplies by 10×.                                                                                                                        |
| `min`           | `min`            | `number`                           | `0`            | Minimum primary pane size in the current mode's units.                                                                                                                                            |
| `max`           | `max`            | `number \| undefined`              | `undefined`    | Maximum primary pane size in the current mode's units. Defaults to the full container size.                                                                                                       |
| `value`         | `value`          | `number`                           | `0`            | Current primary pane size. Host writes update the separator position silently (no `rc-splitter-change`).                                                                                          |
| `defaultValue`  | `default-value`  | `number \| undefined`              | `undefined`    | Initial uncontrolled primary pane size, applied once the splitter has measured its container.                                                                                                     |
| `fixed`         | `fixed`          | `boolean`                          | `false`        | Disable resizing. This legacy boolean locks interaction and is distinct from `mode="fixed"`.                                                                                                      |
| `collapsible`   | `collapsible`    | `boolean`                          | `false`        | Render the separator's collapse/restore button and enable swipe collapse/restore.                                                                                                                 |
| `snapPoints`    | `snap-points`    | `string`                           | `''`           | Ascending whitespace-separated anchors in the current mode's units.                                                                                                                               |
| `swipeVelocity` | `swipe-velocity` | `number`                           | `500`          | Release velocity in px/s that selects the next anchor or collapse action.                                                                                                                         |

### Anchored settling

With `snap-points`, a slow release settles to the nearest anchor and a qualified
swipe settles to the next anchor in its direction. Without snap points, pointer
resizing remains continuous. A collapsible splitter can still swipe toward the
primary minimum to collapse and swipe back to restore its pre-collapse value.

```html
<rc-splitter mode="percent" snap-points="25 50 75" value="50">
  <section>Primary</section>
  <section slot="secondary">Secondary</section>
</rc-splitter>
```

Call `snapTo(index, behavior?)` to select an anchor programmatically. `behavior`
is `'animated'` by default and also accepts `'instant'`.

### CSS custom properties

| Property                                      | Default                                            | Description                                                                                                            |
| --------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `--rc-splitter-separator-size`                | `6px`                                              | Thickness of the separator bar                                                                                         |
| `--rc-splitter-separator-handle-size`         | `100%`                                             | Length of the drag handle within the separator (set to a smaller value to create a centered grab handle)               |
| `--rc-splitter-separator-color`               | `color-mix(in srgb, ButtonBorder 35%, Canvas 65%)` | Background color of the separator bar                                                                                  |
| `--rc-splitter-keyline`                       | `1px solid ButtonBorder`                           | Shared fallback for the four separator border custom properties below                                                  |
| `--rc-splitter-handle-color`                  | `ButtonBorder`                                     | Color of the dot grip indicators (default visual)                                                                      |
| `--rc-splitter-handle-thickness`              | `4px`                                              | Cross-axis size of the visual indicator (dot column width or pill/line thickness)                                      |
| `--rc-splitter-handle-border-radius`          | `0`                                                | Border-radius of the visual indicator; set to a large value (999px, for example) for a pill shape                      |
| `--rc-splitter-handle-pattern`                | 3-dot radial-gradient                              | `background-image` for the visual indicator; set to `none` to use a solid fill via `--rc-splitter-handle-fill` instead |
| `--rc-splitter-handle-fill`                   | `transparent`                                      | `background-color` of the visual indicator; effective when `--rc-splitter-handle-pattern` is `none`                    |
| `--rc-splitter-handle-hover-fill`             | `transparent`                                      | `background-color` of the visual indicator on hover; scoped to the indicator only, not the full strip                  |
| `--rc-splitter-handle-transition`             | `0ms`                                              | CSS transition duration/easing for the visual indicator's background-color changes                                     |
| `--rc-splitter-snap-duration`                 | `200ms`                                            | Duration of anchored settling; reduced motion makes it immediate                                                       |
| `--rc-splitter-collapse-button-size`          | `20px`                                             | Diameter of the collapse/expand toggle button                                                                          |
| `--rc-splitter-collapse-button-offset`        | `8px`                                              | Distance from the start edge of the separator to the collapse button center                                            |
| `--rc-splitter-collapse-button-bg`            | `Canvas`                                           | Collapse button background color                                                                                       |
| `--rc-splitter-collapse-button-hover-bg`      | `ButtonFace`                                       | Collapse button background color on hover                                                                              |
| `--rc-splitter-collapse-button-border`        | `ButtonBorder`                                     | Collapse button border color                                                                                           |
| `--rc-splitter-collapse-button-color`         | `ButtonText`                                       | Collapse button icon color                                                                                             |
| `--rc-splitter-separator-border-inline-start` | `var(--rc-splitter-keyline)`                       | Inline-start (left in LTR) border of the separator                                                                     |
| `--rc-splitter-separator-border-inline-end`   | `var(--rc-splitter-keyline)`                       | Inline-end (right in LTR) border of the separator                                                                      |
| `--rc-splitter-separator-border-block-start`  | `var(--rc-splitter-keyline)`                       | Block-start (top) border when `orientation="vertical"`                                                                 |
| `--rc-splitter-separator-border-block-end`    | `var(--rc-splitter-keyline)`                       | Block-end (bottom) border when `orientation="vertical"`                                                                |

All color defaults use CSS system color keywords, adapting automatically to the user's color
scheme and forced-color modes.

### CSS parts

| Part               | Element                                  | Description                                                                                       |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `primary`          | `div#primary`                            | Primary pane container                                                                            |
| `secondary`        | `aside#secondary`                        | Secondary pane container                                                                          |
| `separator`        | `div#separator`                          | The separator bar                                                                                 |
| `separator-handle` | `div[role="separator"]` inside separator | The focusable drag handle (narrower than the bar if `--rc-splitter-separator-handle-size` is set) |
| `collapse-button`  | `button`                                 | The collapse/expand toggle button (only rendered when `collapsible` is set)                       |

### Slots

| Slot        | Description                                                                         |
| ----------- | ----------------------------------------------------------------------------------- |
| _(default)_ | Primary pane. Its inline-size (or block-size when vertical) is set by the splitter. |
| `secondary` | Secondary pane. Fills remaining space via `flex: 1`.                                |

### Events

| Event                | Bubbles        | Cancelable | Detail                                 | When                                                            |
| -------------------- | -------------- | ---------- | -------------------------------------- | --------------------------------------------------------------- |
| `rc-splitter-change` | Yes (composed) | No         | `{ value: number, valueText: string }` | Separator position changes (on every pointer move or key press) |

### Read-only getters

```ts
valueText: string; // Human-readable value string, for example "240px" or "40%"
```

---

## Keyboard behavior

Focus the separator handle (click or Tab), then:

| Key                        | Action                                                                 |
| -------------------------- | ---------------------------------------------------------------------- |
| `ArrowRight` / `ArrowDown` | Increase primary pane by `step` (horizontal: right; vertical: down)    |
| `ArrowLeft` / `ArrowUp`    | Decrease primary pane by `step`                                        |
| `Shift` + Arrow            | Multiply step by 10×                                                   |
| `Home`                     | Jump to the effective minimum (`min`, default `0`)                     |
| `End`                      | Jump to the effective maximum (`max`, default the full container size) |
| `Enter`                    | Toggle between the effective minimum and the last non-collapsed size   |

---

## ARIA

The separator handle implements the WAI-ARIA slider role pattern:

| Attribute          | Where                  | Value                                                |
| ------------------ | ---------------------- | ---------------------------------------------------- |
| `role="separator"` | Separator handle `div` | None                                                 |
| `aria-label`       | Primary pane           | Value of `label` property                            |
| `aria-orientation` | Separator handle       | `"horizontal"` or `"vertical"`                       |
| `aria-valuenow`    | Separator handle       | Current numeric value                                |
| `aria-valuemin`    | Separator handle       | `0`                                                  |
| `aria-valuemax`    | Separator handle       | Container width or height in current mode units      |
| `aria-valuetext`   | Separator handle       | Human-readable string, for example `"240px"`         |
| `aria-controls`    | Separator handle       | `"primary"`, the ID of the primary pane              |
| `aria-labelledby`  | Separator handle       | `"primary"`, using the primary pane as label context |
| `tabindex="0"`     | Separator handle       | Always focusable                                     |

---

## Example: percentage mode with a styled separator

```html
<rc-splitter
  mode="percent"
  style="
    width: 100%;
    height: 500px;
    --rc-splitter-separator-size: 4px;
    --rc-splitter-separator-color: ButtonFace;
    --rc-splitter-separator-border-inline-start: none;
    --rc-splitter-separator-border-inline-end: none;
  "
>
  <nav>Sidebar</nav>
  <div slot="secondary">Main content</div>
</rc-splitter>
```

---

## Browser support

All modern browsers. It requires Web Components support (Chrome 67+, Firefox 63+, Safari 12.1+)
and `ResizeObserver` (Chrome 64+, Firefox 69+, Safari 13.1+).
