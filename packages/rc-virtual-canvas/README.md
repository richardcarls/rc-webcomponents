# `@rcarls/rc-virtual-canvas`

A virtualized scrollable canvas component. Overlays a transparent scrollable div on top of a slotted `<canvas>` element, dispatching `rc-virtual-canvas-render` events with the current viewport and content rectangles. Consumers draw only what is visible. Built with [Lit 3](https://lit.dev).

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

Place a `<canvas>` inside the component. Set `contentWidth` and `contentHeight` to the total size of your virtual content. On each `rc-virtual-canvas-render` event, use `detail.viewRect` to determine which portion of that content is visible and draw accordingly.

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

  document.querySelector('#vc').addEventListener('rc-virtual-canvas-render', (e) => {
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
| `autoResizeCanvas` | `auto-resize-canvas` | `boolean` | `true` | Keeps the slotted canvas backing store aligned to the measured viewport |
| `renderMode` | `render-mode` | `'continuous' \| 'viewport-change' \| 'manual'` | `'continuous'` | Controls when render events are dispatched |
| `imageRendering` | `image-rendering` | `'auto' \| 'crisp-edges' \| 'pixelated'` | `'auto'` | Convenience value applied to the slotted canvas via `image-rendering` |

### Methods

| Method | Description |
|---|---|
| `getViewRect()` | Returns an immutable snapshot of the current viewport rectangle |
| `scrollToContent(x, y, options?)` | Scrolls so the content coordinate is at the viewport origin |
| `centerOnContent(x, y, options?)` | Scrolls so the content coordinate is centered in the viewport |
| `clientToContent(clientX, clientY)` | Converts browser client coordinates to content coordinates using the current backing-store scale |
| `contentToClient(x, y)` | Converts content coordinates back to browser client coordinates |
| `requestRender(reason?)` | Queues a render event; required when `renderMode` is `'manual'` |

### CSS custom properties

| Property | Default | Description |
|---|---|---|
| `--rc-virtual-canvas-image-rendering` | `auto` | Fallback styling hook for the slotted canvas `image-rendering` value |

### CSS parts

| Part | Description |
|---|---|
| `scroller` | Internal scroll container that owns the virtual content scroll range |
| `overlay` | Viewport-positioned overlay container rendered inside the scroll container |

### Slots

| Slot | Description |
|---|---|
| *(default)* | A single `<canvas>` element. Non-canvas slotted elements are ignored by the component but rendered. |
| `overlay` | Optional viewport-positioned content rendered over the canvas inside the scroll container. |

### Events

| Event | Bubbles | Cancelable | Detail | When |
|---|---|---|---|---|
| `rc-virtual-canvas-render` | Yes (composed) | No | `{ time: DOMHighResTimeStamp, reason: RenderReason, viewRect: ViewRect, contentRect: ViewRect }` | When the active render mode schedules a frame and a canvas is slotted |

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

`viewRect` and `contentRect` are frozen snapshots for the dispatched frame. Keep the object if you need it later; it will not be mutated by future scroll or resize work.

**Render modes:**

| Mode | Behavior |
|---|---|
| `'continuous'` | Dispatches on every animation frame while connected and a canvas is slotted |
| `'viewport-change'` | Dispatches after scroll, resize, content-size changes, and canvas replacement |
| `'manual'` | Dispatches only after `requestRender()` |

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

Pointer input can be mapped through the same coordinate system:

```js
vc.addEventListener('pointerdown', (event) => {
  const point = vc.clientToContent(event.clientX, event.clientY);

  selectThingAt(point.x, point.y);
});
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
