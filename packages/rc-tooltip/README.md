# `@rcarls/rc-tooltip`

Tooltip wrapper for a consumer-owned trigger and descriptive content, following
the [WAI-ARIA Tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/).

Docs: [https://richardcarls.github.io/rc-webcomponents/components/rc-tooltip](https://richardcarls.github.io/rc-webcomponents/components/rc-tooltip).

## Installation

```sh
npm install @rcarls/rc-tooltip
```

## Import

```js
import '@rcarls/rc-tooltip/define';
```

## Usage

Put the trigger in the `trigger` slot and one descriptive element in the
`content` slot:

```html
<rc-tooltip placement="block-end">
  <button slot="trigger">Save</button>
  <span slot="content">Saves the current document.</span>
</rc-tooltip>
```

The component adds a stable `id` and `role="tooltip"` to the content and
adds that ID to the trigger's `aria-describedby` list. The content is shown
when the trigger receives focus or the pointer enters the trigger, stays open
while the pointer is over the trigger or content, and closes when Escape is
pressed or both leave. Tooltip content is descriptive only and must not hold
interactive controls or receive focus.

The native Popover API is used when available. Browsers without a working
Popover API use the same interaction and the `hidden` attribute as a fallback;
positioning uses the shared `AnchorController` with logical placement and
viewport clamping.

## API

| Property            | Attribute   | Type              | Default     | Description                                          |
| ------------------- | ----------- | ----------------- | ----------- | ---------------------------------------------------- |
| `placement`         | `placement` | `AnchorPlacement` | `block-end` | Preferred logical placement relative to the trigger. |
| _(read-only state)_ | `open`      | boolean attribute | absent      | Set by the component while the tooltip is visible.   |

### Slots

| Slot        | Description                                             |
| ----------- | ------------------------------------------------------- |
| `trigger`   | Consumer-owned focusable trigger element.               |
| `content`   | One consumer-owned element containing descriptive text. |
| _(default)_ | Fallback content slot when `content` is omitted.        |

### CSS custom properties

| Property                       | Default                | Description                  |
| ------------------------------ | ---------------------- | ---------------------------- |
| `--rc-tooltip-max-inline-size` | `20rem`                | Maximum tooltip inline size. |
| `--rc-tooltip-padding-block`   | `0.25em`               | Block-axis padding.          |
| `--rc-tooltip-padding-inline`  | `0.5em`                | Inline-axis padding.         |
| `--rc-tooltip-border`          | `1px solid CanvasText` | Tooltip border.              |
| `--rc-tooltip-radius`          | `var(--rc-radius-sm)`  | Tooltip corner radius.       |
| `--rc-tooltip-background`      | `CanvasText`           | Tooltip background.          |
| `--rc-tooltip-color`           | `Canvas`               | Tooltip text color.          |
| `--rc-tooltip-shadow`          | `none`                 | Tooltip shadow.              |
| `--rc-tooltip-font`            | `inherit`              | Tooltip font.                |
| `--rc-tooltip-line-height`     | `normal`               | Tooltip line height.         |
| `--rc-tooltip-z-index`         | `1`                    | Fallback stacking order.     |

### CSS parts

| Part   | Description                              |
| ------ | ---------------------------------------- |
| `root` | Shadow-DOM wrapper containing the slots. |
