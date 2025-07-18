# `@rcarls/rc-virtual-canvas`

A virtualized scrollable canvas component. Overlays a transparent scrollable div on top of a slotted `<canvas>` element, dispatching `render` events on every animation frame with the current viewport and content rectangles. Consumers draw only what is visible. Built with [Lit 3](https://lit.dev).

---

## Installation

```bash
npm install @rcarls/rc-virtual-canvas
```

## Import

```js
import '@rcarls/rc-virtual-canvas';                              // side-effect: registers <rc-virtual-canvas>
import { RCVirtualCanvas } from '@rcarls/rc-virtual-canvas';    // named class export
```

---

## Basic usage

Place a `<canvas>` inside the component. Set `contentWidth` and `contentHeight` to the total size of your virtual content. On each `render` event, use `detail.viewRect` to determine which portion of that content is visible and draw accordingly.

```html
<rc-virtual-canvas
  id="vc"
  contentWidth="4000"
  contentHeight="3000"
  style="width: 800px; height: 600px;"
>
  <canvas id="canvas" width="800" height="600"></canvas>
</rc-virtual-canvas>

<script>
  const ctx = document.querySelector('#canvas').getContext('2d');

  document.querySelector('#vc').addEventListener('render', (e) => {
    const { time, viewRect } = e.detail;

    ctx.clearRect(0, 0, viewRect.width, viewRect.height);

    // Draw only content within viewRect.x / viewRect.y offset
    drawScene(ctx, viewRect);
  });
</script>
```

The canvas element should match the component's rendered size (set via CSS). The virtual content is larger — scrolling is handled by an absolutely-positioned transparent `<div>` that triggers native scroll events.

---

## API

### Properties / attributes

| Property | Attribute | Type | Default | Description |
|---|---|---|---|---|
| `contentWidth` | `contentWidth` | `number` | `0` | Total pixel width of the virtual content |
| `contentHeight` | `contentHeight` | `number` | `0` | Total pixel height of the virtual content |

### CSS custom properties

None.

### CSS parts

None.

### Slots

| Slot | Description |
|---|---|
| *(default)* | A single `<canvas>` element. Non-canvas slotted elements are ignored by the component but rendered. |

### Events

| Event | Bubbles | Cancelable | Detail | When |
|---|---|---|---|---|
| `render` | Yes (composed) | No | `{ time: DOMHighResTimeStamp, viewRect: ViewRect, contentRect: ViewRect }` | Every animation frame while the component is connected and a canvas is slotted |

**`ViewRect` shape:**

```ts
type ViewRect = {
  x: number;      // Scroll offset — the x origin of the visible window in content space
  y: number;      // Scroll offset — the y origin of the visible window in content space
  width: number;  // Visible width in device pixels (from ResizeObserver devicePixelContentBoxSize)
  height: number; // Visible height in device pixels
};
```

`viewRect` is the visible window into the virtual content. `contentRect` is the full content bounds (`x: 0, y: 0, width: contentWidth, height: contentHeight`).

---

## Coordinate system

The component maps scroll position directly to content coordinates:

- `viewRect.x` = `scrollLeft` of the internal scroll container
- `viewRect.y` = `scrollTop` of the internal scroll container
- `viewRect.width` / `viewRect.height` = canvas dimensions in device pixels (high-DPI aware)

When drawing, offset your scene by `viewRect.x` and `viewRect.y` to align the visible portion with the canvas origin:

```js
ctx.translate(-viewRect.x, -viewRect.y);
drawEntireScene(ctx);
ctx.resetTransform();
```

---

## Accessibility

`rc-virtual-canvas` is a rendering surface. A `<canvas>` element has no inherent semantics — it is a bitmap, not a document. If your canvas renders interactive or informational content, you are responsible for providing supplemental accessibility:

- Add an accessible `<div>` or `<table>` alternative outside the canvas with the same information (hidden visually with `clip-path` or similar, not `display: none`).
- Use `aria-label` or `aria-labelledby` on the `<canvas>` to describe what it shows.
- For interactive canvas content (hit-testing, drag-and-drop), implement keyboard equivalents on a separate focusable element.

---

## Browser support

| Feature | Requirement |
|---|---|
| Core | Chrome 67+, Firefox 63+, Safari 12.1+ (Web Components) |
| Device-pixel-accurate sizing | Chrome 84+, Firefox 93+, Safari 15.4+ (ResizeObserver `devicePixelContentBoxSize`) |
