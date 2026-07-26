import { LitElement, html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import {
  DragGestureController,
  type DragGestureActivation,
  type DragGestureAxis,
  type DragGestureDetail,
} from './DragGestureController';

class DragGestureTestHost extends LitElement {
  axis: DragGestureAxis = 'both';
  activation: DragGestureActivation = 'immediate';
  alternate = false;
  onStart = vi.fn<(detail: DragGestureDetail) => void>();
  onMove = vi.fn<(detail: DragGestureDetail) => void>();
  onEnd = vi.fn<(detail: DragGestureDetail) => void>();
  onCancel = vi.fn<(detail: DragGestureDetail) => void>();

  private readonly _gesture = new DragGestureController(this, {
    target: () => this.renderRoot.querySelector('[data-handle]'),
    axis: this.axis,
    activation: this.activation,
    onStart: (detail) => this.onStart(detail),
    onMove: (detail) => this.onMove(detail),
    onEnd: (detail) => this.onEnd(detail),
    onCancel: (detail) => this.onCancel(detail),
  });

  setGestureOptions(axis: DragGestureAxis, activation: DragGestureActivation): void {
    this.axis = axis;
    this.activation = activation;
    this._gesture.setOptions({ axis, activation });
  }

  override render() {
    return this.alternate
      ? html`<button data-handle type="button"></button>`
      : html`<div data-handle tabindex="0"></div>`;
  }
}

customElements.get('drag-gesture-test-host') ||
  customElements.define('drag-gesture-test-host', DragGestureTestHost);

function firePointer(target: EventTarget, type: string, init: PointerEventInit = {}): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      isPrimary: true,
      pointerId: 1,
      pointerType: 'touch',
      ...init,
    }),
  );
}

async function setup() {
  const screen = render(html`<drag-gesture-test-host></drag-gesture-test-host>`);
  const $host = screen.container.querySelector('drag-gesture-test-host') as DragGestureTestHost;

  await $host.updateComplete;

  const $handle = $host.renderRoot.querySelector('[data-handle]') as HTMLElement;

  return { $host, $handle };
}

test('reports immediate drag lifecycle, deltas, and recent velocity', async () => {
  const { $host, $handle } = await setup();

  firePointer($handle, 'pointerdown', { clientX: 10, clientY: 20 });
  await new Promise((resolve) => setTimeout(resolve, 12));
  firePointer($handle, 'pointermove', { clientX: 30, clientY: 25 });
  firePointer($handle, 'pointerup', { clientX: 40, clientY: 30 });

  expect($host.onStart).toHaveBeenCalledOnce();
  expect($host.onMove).toHaveBeenCalledOnce();
  expect($host.onEnd).toHaveBeenCalledOnce();

  expect($host.onEnd.mock.calls[0][0]).toMatchObject({
    deltaX: 30,
    deltaY: 10,
    pointerType: 'touch',
  });

  expect($host.onEnd.mock.calls[0][0].velocityX).toBeGreaterThan(0);
});

test('delayed horizontal activation rejects dominant vertical movement', async () => {
  const { $host, $handle } = await setup();

  $host.setGestureOptions('x', 'axis');
  firePointer($handle, 'pointerdown');
  firePointer($handle, 'pointermove', { clientX: 3, clientY: 12 });
  firePointer($handle, 'pointermove', { clientX: 30, clientY: 12 });

  expect($host.onStart).not.toHaveBeenCalled();
  expect($host.onMove).not.toHaveBeenCalled();
});

test('delayed horizontal activation starts after dominant-axis intent', async () => {
  const { $host, $handle } = await setup();

  $host.setGestureOptions('x', 'axis');
  firePointer($handle, 'pointerdown');
  firePointer($handle, 'pointermove', { clientX: 12, clientY: 2 });

  expect($host.onStart).toHaveBeenCalledOnce();
  expect($host.onMove).toHaveBeenCalledOnce();
});

test('ignores secondary pointers and non-primary mouse buttons', async () => {
  const { $host, $handle } = await setup();

  firePointer($handle, 'pointerdown', { isPrimary: false, pointerId: 2 });

  firePointer($handle, 'pointerdown', {
    button: 1,
    pointerId: 2,
    pointerType: 'mouse',
  });

  expect($host.onStart).not.toHaveBeenCalled();
});

test('cancels on pointercancel and can start a later gesture', async () => {
  const { $host, $handle } = await setup();

  firePointer($handle, 'pointerdown');
  firePointer($handle, 'pointercancel');
  firePointer($handle, 'pointerdown');

  expect($host.onCancel).toHaveBeenCalledOnce();
  expect($host.onStart).toHaveBeenCalledTimes(2);
});

test('treats lost pointer capture as cancellation', async () => {
  const { $host, $handle } = await setup();

  firePointer($handle, 'pointerdown');
  firePointer($handle, 'lostpointercapture');

  expect($host.onCancel).toHaveBeenCalledOnce();
});

test('continues when synthetic pointer capture is unavailable', async () => {
  const { $host, $handle } = await setup();
  const capture = vi.spyOn($handle, 'setPointerCapture').mockImplementation(() => {
    throw new DOMException('Synthetic pointer', 'NotFoundError');
  });

  firePointer($handle, 'pointerdown');
  firePointer($handle, 'pointermove', { clientX: 12 });
  firePointer($handle, 'pointerup', { clientX: 12 });

  expect(capture).toHaveBeenCalledWith(1);
  expect($host.onStart).toHaveBeenCalledOnce();
  expect($host.onEnd).toHaveBeenCalledOnce();
});

test('removes active-cycle listeners when disconnected', async () => {
  const { $host, $handle } = await setup();

  firePointer($handle, 'pointerdown');
  $host.remove();
  firePointer($handle, 'pointermove', { clientX: 20 });
  firePointer($handle, 'pointerup', { clientX: 20 });

  expect($host.onMove).not.toHaveBeenCalled();
  expect($host.onEnd).not.toHaveBeenCalled();
});

test('rebinds when a target is replaced after render', async () => {
  const { $host } = await setup();

  $host.alternate = true;
  $host.requestUpdate();
  await $host.updateComplete;

  const $replacement = $host.renderRoot.querySelector('[data-handle]') as HTMLElement;

  firePointer($replacement, 'pointerdown');

  expect($host.onStart).toHaveBeenCalledOnce();
});
