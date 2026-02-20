import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './define';
import type {
  RCVirtualCanvas,
  RCVirtualCanvasRenderInit,
} from './rc-virtual-canvas';

function getScrollRoot(host: RCVirtualCanvas) {
  const root = host.shadowRoot?.querySelector<HTMLDivElement>('#root');

  if (!root) {
    throw new Error('Scroll root was not rendered');
  }

  return root;
}

function lastRenderEvent(renderSpy: ReturnType<typeof vi.fn>) {
  return renderSpy.mock.calls.at(-1)?.[0] as
    | CustomEvent<RCVirtualCanvasRenderInit>
    | undefined;
}

test('RCVirtualCanvas dispatches rc-virtual-canvas-render with viewport and content detail', async () => {
  const renderSpy = vi.fn();

  render(html`
    <rc-virtual-canvas
      data-testid="virtual-canvas"
      contentWidth="800"
      contentHeight="600"
      @rc-virtual-canvas-render=${renderSpy}
    >
      <canvas style="width: 320px; height: 240px;"></canvas>
    </rc-virtual-canvas>
  `);

  await vi.waitFor(() => {
    expect(renderSpy).toHaveBeenCalled();
  });

  const event = lastRenderEvent(renderSpy);

  expect(event?.detail.contentRect).toEqual({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
  });
  expect(event?.detail.viewRect.x).toBe(0);
  expect(event?.detail.viewRect.y).toBe(0);
  expect(event?.detail.reason).toBeTypeOf('string');
  expect(event?.detail.time).toBeTypeOf('number');
});

test('RCVirtualCanvas exposes immutable viewport snapshots', async () => {
  const renderSpy = vi.fn();
  const screen = render(html`
    <rc-virtual-canvas
      data-testid="virtual-canvas"
      contentWidth="800"
      contentHeight="600"
      @rc-virtual-canvas-render=${renderSpy}
    >
      <canvas style="width: 320px; height: 240px;"></canvas>
    </rc-virtual-canvas>
  `);

  const host = screen
    .getByTestId('virtual-canvas')
    .element() as RCVirtualCanvas;

  await vi.waitFor(() => {
    expect(renderSpy).toHaveBeenCalled();
  });

  const methodRect = host.getViewRect();
  const event = lastRenderEvent(renderSpy);

  expect(Object.isFrozen(methodRect)).toBe(true);
  expect(Object.isFrozen(event?.detail.viewRect)).toBe(true);
  expect(Object.isFrozen(event?.detail.contentRect)).toBe(true);
});

test('RCVirtualCanvas scrolls and centers on content coordinates', async () => {
  const renderSpy = vi.fn();
  const screen = render(html`
    <rc-virtual-canvas
      data-testid="virtual-canvas"
      contentWidth="1000"
      contentHeight="800"
      render-mode="viewport-change"
      style="display: block; width: 200px; height: 100px;"
      @rc-virtual-canvas-render=${renderSpy}
    >
      <canvas style="display: block; width: 200px; height: 100px;"></canvas>
    </rc-virtual-canvas>
  `);

  const host = screen
    .getByTestId('virtual-canvas')
    .element() as RCVirtualCanvas;

  await vi.waitFor(() => {
    expect(renderSpy).toHaveBeenCalled();
  });

  host.scrollToContent(120, 80);

  await vi.waitFor(() => {
    expect(host.getViewRect().x).toBeCloseTo(120, 0);
    expect(host.getViewRect().y).toBeCloseTo(80, 0);
  });

  const root = getScrollRoot(host);

  host.centerOnContent(400, 300);

  await vi.waitFor(() => {
    expect(host.getViewRect().x).toBeCloseTo(400 - (root.clientWidth * 0.5));
    expect(host.getViewRect().y).toBeCloseTo(300 - (root.clientHeight * 0.5), 0);
  });
});

test('RCVirtualCanvas maps client and content coordinates through the backing store scale', async () => {
  const screen = render(html`
    <rc-virtual-canvas
      data-testid="virtual-canvas"
      contentWidth="1000"
      contentHeight="800"
      .autoResizeCanvas=${false}
      render-mode="viewport-change"
      style="display: block; width: 200px; height: 100px;"
    >
      <canvas
        width="400"
        height="200"
        style="display: block; width: 200px; height: 100px;"
      ></canvas>
    </rc-virtual-canvas>
  `);

  const host = screen
    .getByTestId('virtual-canvas')
    .element() as RCVirtualCanvas;

  await host.updateComplete;
  host.scrollToContent(40, 30);

  await vi.waitFor(() => {
    expect(host.getViewRect().x).toBeCloseTo(40, 0);
  });

  const root = getScrollRoot(host);
  const rect = root.getBoundingClientRect();
  const contentPoint = host.clientToContent(rect.left + 50, rect.top + 25);
  const clientPoint = host.contentToClient(contentPoint.x, contentPoint.y);

  expect(contentPoint.x).toBeCloseTo(140, 0);
  expect(contentPoint.y).toBeCloseTo(80, 0);
  expect(Math.round(clientPoint.x)).toBe(Math.round(rect.left + 50));
  expect(Math.round(clientPoint.y)).toBe(Math.round(rect.top + 25));
});

test('RCVirtualCanvas optionally keeps the canvas backing store sized to the viewport', async () => {
  const screen = render(html`
    <rc-virtual-canvas
      data-testid="virtual-canvas"
      render-mode="viewport-change"
      style="display: block; width: 320px; height: 240px;"
    >
      <canvas
        data-testid="canvas"
        style="display: block; width: 320px; height: 240px;"
      ></canvas>
    </rc-virtual-canvas>
  `);

  const canvas = screen.getByTestId('canvas').element() as HTMLCanvasElement;

  await vi.waitFor(() => {
    expect(canvas.width).toBeGreaterThanOrEqual(320);
    expect(canvas.height).toBeGreaterThanOrEqual(240);
  });
});

test('RCVirtualCanvas preserves manual canvas sizing when autoResizeCanvas is false', async () => {
  const screen = render(html`
    <rc-virtual-canvas
      data-testid="virtual-canvas"
      .autoResizeCanvas=${false}
      render-mode="viewport-change"
      style="display: block; width: 320px; height: 240px;"
    >
      <canvas
        data-testid="canvas"
        width="64"
        height="48"
        style="display: block; width: 320px; height: 240px;"
      ></canvas>
    </rc-virtual-canvas>
  `);

  const canvas = screen.getByTestId('canvas').element() as HTMLCanvasElement;

  await vi.waitFor(() => {
    expect(canvas.width).toBe(64);
    expect(canvas.height).toBe(48);
  });
});

test('RCVirtualCanvas supports continuous, viewport-change, and manual render modes', async () => {
  const continuousSpy = vi.fn();
  const viewportSpy = vi.fn();
  const manualSpy = vi.fn();
  const screen = render(html`
    <div>
      <rc-virtual-canvas
        data-testid="continuous"
        @rc-virtual-canvas-render=${continuousSpy}
      >
        <canvas style="display: block; width: 50px; height: 50px;"></canvas>
      </rc-virtual-canvas>
      <rc-virtual-canvas
        data-testid="viewport"
        contentWidth="500"
        contentHeight="500"
        render-mode="viewport-change"
        style="display: block; width: 50px; height: 50px;"
        @rc-virtual-canvas-render=${viewportSpy}
      >
        <canvas style="display: block; width: 50px; height: 50px;"></canvas>
      </rc-virtual-canvas>
      <rc-virtual-canvas
        data-testid="manual"
        render-mode="manual"
        @rc-virtual-canvas-render=${manualSpy}
      >
        <canvas style="display: block; width: 50px; height: 50px;"></canvas>
      </rc-virtual-canvas>
    </div>
  `);

  const viewportHost = screen
    .getByTestId('viewport')
    .element() as RCVirtualCanvas;
  const manualHost = screen
    .getByTestId('manual')
    .element() as RCVirtualCanvas;

  await vi.waitFor(() => {
    expect(continuousSpy.mock.calls.length).toBeGreaterThan(1);
    expect(viewportSpy).toHaveBeenCalled();
  });

  const viewportCallCount = viewportSpy.mock.calls.length;

  await new Promise(resolve => {
    window.setTimeout(resolve, 80);
  });

  expect(viewportSpy.mock.calls.length).toBe(viewportCallCount);
  expect(manualSpy).not.toHaveBeenCalled();

  viewportHost.scrollToContent(20, 10);
  manualHost.requestRender();

  await vi.waitFor(() => {
    expect(viewportSpy.mock.calls.length).toBeGreaterThan(viewportCallCount);
    expect(manualSpy).toHaveBeenCalledTimes(1);
  });

  expect(lastRenderEvent(manualSpy)?.detail.reason).toBe('manual');
});

test('RCVirtualCanvas tracks slotted canvas replacement', async () => {
  const renderSpy = vi.fn();
  const screen = render(html`
    <rc-virtual-canvas
      data-testid="virtual-canvas"
      @rc-virtual-canvas-render=${renderSpy}
    >
      <canvas data-testid="first"></canvas>
    </rc-virtual-canvas>
  `);

  const host = screen
    .getByTestId('virtual-canvas')
    .element() as RCVirtualCanvas;

  await vi.waitFor(() => {
    expect(renderSpy).toHaveBeenCalled();
  });

  const firstEventCount = renderSpy.mock.calls.length;
  const canvas = document.createElement('canvas');

  canvas.dataset.testid = 'second';
  host.replaceChildren(canvas);

  await vi.waitFor(() => {
    expect(host.querySelector('[data-testid="second"]')).toBe(canvas);
    expect(renderSpy.mock.calls.length).toBeGreaterThan(firstEventCount);
  });
});

test('RCVirtualCanvas schedules a fresh animation frame when reconnected with a pending render', async () => {
  const originalRequestAnimationFrame = window.requestAnimationFrame;
  const renderSpy = vi.fn();
  const animationFrameCallbacks: FrameRequestCallback[] = [];
  const requestAnimationFrameSpy = vi
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((callback: FrameRequestCallback) => {
      animationFrameCallbacks.push(callback);

      return animationFrameCallbacks.length;
    });

  try {
    render(html`
      <rc-virtual-canvas
        data-testid="virtual-canvas"
        @rc-virtual-canvas-render=${renderSpy}
      >
        <canvas style="display: block; width: 50px; height: 50px;"></canvas>
      </rc-virtual-canvas>
    `);

    const host = document.querySelector('rc-virtual-canvas') as RCVirtualCanvas;

    await host.updateComplete;

    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);

    host.connectedCallback();

    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(2);

    const callback = animationFrameCallbacks.at(-1);

    if (!callback) {
      throw new Error('No animation frame was scheduled');
    }

    requestAnimationFrameSpy.mockImplementation(originalRequestAnimationFrame);
    callback(performance.now());

    await vi.waitFor(() => {
      expect(renderSpy).toHaveBeenCalled();
    });
  } finally {
    requestAnimationFrameSpy.mockRestore();
  }
});

test('RCVirtualCanvas cancels animation and resize observation on disconnect', async () => {
  const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame');
  const screen = render(html`
    <rc-virtual-canvas data-testid="virtual-canvas">
      <canvas></canvas>
    </rc-virtual-canvas>
  `);

  const host = screen
    .getByTestId('virtual-canvas')
    .element() as RCVirtualCanvas;

  host.remove();

  await vi.waitFor(() => {
    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
  });

  cancelAnimationFrameSpy.mockRestore();
});
