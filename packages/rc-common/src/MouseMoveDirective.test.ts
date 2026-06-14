import { html } from 'lit';
import { test, expect, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-lit';

import { mouseMove } from './MouseMoveDirective';

function firePointerEvent(
  target: EventTarget,
  type: string,
  init?: PointerEventInit,
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      pointerType: 'mouse',
      ...init,
    }),
  );
}

test('mouseMove: callback fires on pointermove after pointerdown', async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div tabindex="0" data-testid="handle" ${mouseMove(cb)}></div>`,
  );
  const el = screen.getByTestId('handle');
  const node = await el.element();

  firePointerEvent(node, 'pointerdown');
  firePointerEvent(node, 'pointermove');
  firePointerEvent(node, 'pointermove');

  expect(cb).toHaveBeenCalledTimes(2);
});

test('mouseMove: callback does not fire before pointerdown', async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div tabindex="0" data-testid="handle" ${mouseMove(cb)}></div>`,
  );
  const node = await screen.getByTestId('handle').element();

  firePointerEvent(node, 'pointermove');

  expect(cb).not.toHaveBeenCalled();
});

test('mouseMove: callback receives the pointermove event', async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div tabindex="0" data-testid="handle" ${mouseMove(cb)}></div>`,
  );
  const node = await screen.getByTestId('handle').element();

  firePointerEvent(node, 'pointerdown');
  firePointerEvent(node, 'pointermove', { clientX: 42, clientY: 99 });

  expect(cb).toHaveBeenCalledOnce();
  const evt = cb.mock.calls[0][0] as PointerEvent;
  expect(evt.clientX).toBe(42);
  expect(evt.clientY).toBe(99);
  expect(evt.pointerType).toBe('mouse');
});

test('mouseMove: pointermove stops firing after pointerup', async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div tabindex="0" data-testid="handle" ${mouseMove(cb)}></div>`,
  );
  const node = await screen.getByTestId('handle').element();

  firePointerEvent(node, 'pointerdown');
  firePointerEvent(node, 'pointermove');
  expect(cb).toHaveBeenCalledTimes(1);

  firePointerEvent(node, 'pointerup');
  firePointerEvent(node, 'pointermove');
  firePointerEvent(node, 'pointermove');

  expect(cb).toHaveBeenCalledTimes(1);
});

test('mouseMove: pointermove stops firing after pointercancel', async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div tabindex="0" data-testid="handle" ${mouseMove(cb)}></div>`,
  );
  const node = await screen.getByTestId('handle').element();

  firePointerEvent(node, 'pointerdown');
  firePointerEvent(node, 'pointermove');
  firePointerEvent(node, 'pointercancel');
  firePointerEvent(node, 'pointermove');

  expect(cb).toHaveBeenCalledTimes(1);
});

test('mouseMove: lostpointercapture ends the active drag cycle', async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div tabindex="0" data-testid="handle" ${mouseMove(cb)}></div>`,
  );
  const node = await screen.getByTestId('handle').element();

  firePointerEvent(node, 'pointerdown');
  firePointerEvent(node, 'pointermove');
  firePointerEvent(node, 'lostpointercapture');
  firePointerEvent(node, 'pointermove');

  expect(cb).toHaveBeenCalledTimes(1);
});

test('mouseMove: new pointerdown re-arms after pointerup', async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div tabindex="0" data-testid="handle" ${mouseMove(cb)}></div>`,
  );
  const node = await screen.getByTestId('handle').element();

  firePointerEvent(node, 'pointerdown');
  firePointerEvent(node, 'pointermove');
  firePointerEvent(node, 'pointerup');

  firePointerEvent(node, 'pointerdown');
  firePointerEvent(node, 'pointermove');
  firePointerEvent(node, 'pointermove');

  expect(cb).toHaveBeenCalledTimes(3);
});

test('mouseMove: click does not arm pointer movement', async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div tabindex="0" data-testid="handle" ${mouseMove(cb)}></div>`,
  );
  const node = await screen.getByTestId('handle').element();

  node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  firePointerEvent(node, 'pointermove');

  expect(cb).not.toHaveBeenCalled();
});

test('mouseMove: pointerdown focuses the element', async () => {
  const cb = vi.fn();
  const screen = render(
    html`<div tabindex="0" data-testid="handle" ${mouseMove(cb)}></div>`,
  );
  const el = screen.getByTestId('handle');
  const node = await el.element();

  await userEvent.click(document.body);
  await expect.element(el).not.toHaveFocus();

  firePointerEvent(node, 'pointerdown');

  await expect.element(el).toHaveFocus();
});
