<script setup>
import { onMounted } from 'vue';

const COLS = 40;
const ROWS = 30;
const TILE = 32;
const SOURCE_TILE = 32;
let spritesheet;
let spritesReady = false;

// Deterministic tile colors (hue based on position)
function tileColor(row, col) {
  const hue = ((row * 7 + col * 13) % 360 + 360) % 360;
  return `hsl(${hue},55%,40%)`;
}

function spriteFor(row, col) {
  const spriteCols = Math.floor(spritesheet.naturalWidth / SOURCE_TILE) || 1;
  const spriteRows = Math.floor(spritesheet.naturalHeight / SOURCE_TILE) || 1;
  const index = (row * 3 + col * 5 + row * col) % (spriteCols * spriteRows);
  return {
    x: (index % spriteCols) * SOURCE_TILE,
    y: Math.floor(index / spriteCols) * SOURCE_TILE,
  };
}

function renderTilemap(e) {
  const canvasEl = document.getElementById('demo-canvas-el');
  if (!canvasEl) return;

  const { viewRect } = e.detail;
  const vpW = canvasEl.clientWidth;
  const vpH = canvasEl.clientHeight;
  if (!vpW || !vpH) return;

  canvasEl.width = viewRect.width;
  canvasEl.height = viewRect.height;

  const ctx = canvasEl.getContext('2d');
  const scaleX = viewRect.width / vpW;
  const scaleY = viewRect.height / vpH;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * TILE;
      const y = r * TILE;
      if (x + TILE < viewRect.x || x > viewRect.x + vpW) continue;
      if (y + TILE < viewRect.y || y > viewRect.y + vpH) continue;

      const dx = (x - viewRect.x) * scaleX;
      const dy = (y - viewRect.y) * scaleY;
      const sizeX = TILE * scaleX;
      const sizeY = TILE * scaleY;

      if (spritesReady) {
        const sprite = spriteFor(r, c);
        ctx.drawImage(
          spritesheet,
          sprite.x, sprite.y, SOURCE_TILE, SOURCE_TILE,
          dx, dy, sizeX, sizeY,
        );
      } else {
        ctx.fillStyle = tileColor(r, c);
        ctx.fillRect(dx, dy, sizeX - 1, sizeY - 1);
      }
    }
  }

  // Viewport label
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillRect(0, 0, 200 * scaleX, 18 * scaleY);
  ctx.fillStyle = '#000';
  ctx.font = `${12 * scaleY}px monospace`;
  ctx.fillText(
    `view ${Math.round(viewRect.x)},${Math.round(viewRect.y)} — scroll to pan`,
    4 * scaleX, 13 * scaleY,
  );
}

onMounted(() => {
  // Simple tilemap: render a grid of colored tiles
  const rcCanvas = document.getElementById('demo-virtual-canvas');
  if (!rcCanvas) return;

  rcCanvas.setAttribute('contentWidth', String(COLS * TILE));
  rcCanvas.setAttribute('contentHeight', String(ROWS * TILE));

  spritesheet = new Image();
  spritesheet.addEventListener('load', () => {
    spritesReady = true;
    rcCanvas.requestRender?.();
  }, { once: true });
  spritesheet.src = '/default_tiles.png';

  requestAnimationFrame(() => {
    requestAnimationFrame(() => rcCanvas.requestRender?.());
  });
});
</script>

# rc-virtual-canvas

A virtualized canvas component. Only the portion of the content visible in the viewport is drawn on each render frame, making it efficient for large grids, tilemaps, and drawing surfaces.

<AtAGlance
  package-name="@rcarls/rc-virtual-canvas"
  tag="rc-virtual-canvas"
  native="Renders an internal canvas-like viewport"
  state="Viewport and render state managed by the component"
  :events="['rc-virtual-canvas-pointer', 'rc-virtual-canvas-render']"
  :related="[
    { label: 'rc-splitter', href: '/components/rc-splitter' }
  ]"
/>

## Installation

::: code-group

```sh [npm]
npm install @rcarls/rc-virtual-canvas
```

```sh [yarn]
yarn add @rcarls/rc-virtual-canvas
```

:::

```js
import '@rcarls/rc-virtual-canvas/define';
```

## Tilemap demo

Scroll to pan across the 1280 × 960 virtual canvas. Only visible tiles are drawn each frame.

<ClientOnly>
<div class="demo-section">
  <rc-virtual-canvas
    id="demo-virtual-canvas"
    contentWidth="1280"
    contentHeight="960"
    style="display:block;width:100%;border:1px solid var(--rc-border-color,ButtonBorder);background:#111;"
    @rc-virtual-canvas-render="renderTilemap"
  >
    <canvas id="demo-canvas-el" style="display:block;width:100%;aspect-ratio:4/3;"></canvas>
  </rc-virtual-canvas>
</div>
</ClientOnly>

```html
<rc-virtual-canvas
  id="canvas"
  contentWidth="1600"
  contentHeight="1200"
  style="display: block; width: 100%; height: 400px;"
>
  <canvas style="display: block; width: 100%; height: 100%;"></canvas>
</rc-virtual-canvas>
```

```js
canvas.addEventListener('rc-virtual-canvas-render', (e) => {
  const { viewRect, time } = e.detail;
  // viewRect: { x, y, width, height } — the visible region in content coords
  // Resize the canvas to match:
  myCanvas.width = viewRect.width;
  myCanvas.height = viewRect.height;

  const ctx = myCanvas.getContext('2d');
  ctx.clearRect(0, 0, viewRect.width, viewRect.height);

  // Draw only items within viewRect (offset by viewRect.x / viewRect.y)
  for (const tile of tiles) {
    if (tile.x + TILE_SIZE < viewRect.x) continue;
    if (tile.x > viewRect.x + viewportWidth) continue;
    ctx.drawImage(tileset, tile.srcX, tile.srcY, TILE_SIZE, TILE_SIZE,
      tile.x - viewRect.x, tile.y - viewRect.y, TILE_SIZE, TILE_SIZE);
  }
});
```

## Drawing surface

Combine `rc-virtual-canvas` with pointer events and an `OffscreenCanvas` for a pannable drawing surface. The `OffscreenCanvas` holds the persistent drawing in content coordinates; the visible canvas shows only the current viewport slice.

```js
const offscreen = new OffscreenCanvas(CANVAS_W, CANVAS_H);
const offCtx = offscreen.getContext('2d');

rcCanvas.addEventListener('rc-virtual-canvas-render', (e) => {
  const { viewRect } = e.detail;
  const vpW = myCanvas.clientWidth;
  const vpH = myCanvas.clientHeight;

  myCanvas.width = viewRect.width;
  myCanvas.height = viewRect.height;

  const ctx = myCanvas.getContext('2d');
  ctx.drawImage(offscreen,
    viewRect.x, viewRect.y, vpW, vpH,   // source (content coords)
    0, 0, viewRect.width, viewRect.height, // destination (canvas pixels)
  );
});

rcCanvas.addEventListener('pointermove', (e) => {
  if (!isDrawing) return;
  const rect = rcCanvas.getBoundingClientRect();
  const cx = e.clientX - rect.left + currentViewRect.x;
  const cy = e.clientY - rect.top  + currentViewRect.y;
  offCtx.lineTo(cx, cy);
  offCtx.stroke();
  rcCanvas.requestRender();
});
```

::: tip Full drawing surface demo
Run `yarn workspace @rcarls/rc-virtual-canvas run dev` to see the full interactive drawing demo with color/size controls and a 1600 × 1200 pannable surface.
:::

## API

<ApiTable tag="rc-virtual-canvas" />
