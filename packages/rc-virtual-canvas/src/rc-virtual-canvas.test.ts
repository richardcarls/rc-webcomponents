import { test, expect, vi } from 'vitest';
import { render } from 'vitest-browser-lit';
import { html } from 'lit';

import './define';
import type {
  RCVirtualCanvas,
  RCVirtualCanvasRenderInit,
} from './rc-virtual-canvas';

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

  const event = renderSpy.mock.calls.at(-1)?.[0] as
    | CustomEvent<RCVirtualCanvasRenderInit>
    | undefined;

  expect(event?.detail.contentRect).toEqual({
    x: 0,
    y: 0,
    width: 800,
    height: 600,
  });
  expect(event?.detail.viewRect.x).toBe(0);
  expect(event?.detail.viewRect.y).toBe(0);
  expect(event?.detail.time).toBeTypeOf('number');
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
