import { html, type ReactiveControllerHost } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import { DragController } from './DragController.js';

function createHost(): ReactiveControllerHost {
  return {
    addController() {},
    removeController() {},
    requestUpdate() {},
    updateComplete: Promise.resolve(true),
  };
}

function pressArrowRight($handle: HTMLElement): void {
  $handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
}

test('dispose restores the handle and removes the controller from its host', async () => {
  const screen = render(html`
    <div
      data-testid="target"
      style="position: fixed; left: 50px; top: 50px; inline-size: 200px; block-size: 100px;"
    >
      <span data-testid="handle">Move</span>
    </div>
  `);
  const $target = (await screen.getByTestId('target').element()) as HTMLElement;
  const $handle = (await screen.getByTestId('handle').element()) as HTMLElement;
  const host = createHost();
  const removeController = vi.spyOn(host, 'removeController');
  const ctl = new DragController(host, { target: $target, handle: $handle });

  ctl.hostConnected();

  expect($handle.getAttribute('tabindex')).toBe('0');

  const start = $target.getBoundingClientRect().left;

  pressArrowRight($handle);

  expect($target.getBoundingClientRect().left).toBe(start + 4);

  ctl.dispose();

  expect($handle.hasAttribute('tabindex')).toBe(false);
  // The controller and its pointer gesture both leave the host.
  expect(removeController).toHaveBeenCalledTimes(2);
  expect(removeController).toHaveBeenCalledWith(ctl);

  pressArrowRight($handle);

  expect($target.getBoundingClientRect().left).toBe(start + 4);
});

test('dispose keeps an author tabindex on the handle', async () => {
  const screen = render(html`
    <div data-testid="target" style="position: fixed; inline-size: 200px; block-size: 100px;">
      <span data-testid="handle" tabindex="-1">Move</span>
    </div>
  `);
  const $target = (await screen.getByTestId('target').element()) as HTMLElement;
  const $handle = (await screen.getByTestId('handle').element()) as HTMLElement;
  const ctl = new DragController(createHost(), { target: $target, handle: $handle });

  ctl.hostConnected();
  ctl.dispose();

  expect($handle.getAttribute('tabindex')).toBe('-1');
});

test('dispose keeps a tabindex changed by the author after attachment', async () => {
  const screen = render(html`
    <div data-testid="target"><span data-testid="handle">Move</span></div>
  `);
  const $target = (await screen.getByTestId('target').element()) as HTMLElement;
  const $handle = (await screen.getByTestId('handle').element()) as HTMLElement;
  const ctl = new DragController(createHost(), { target: $target, handle: $handle });

  ctl.hostConnected();
  $handle.setAttribute('tabindex', '-1');
  ctl.dispose();
  ctl.dispose();

  expect($handle.getAttribute('tabindex')).toBe('-1');
});

test('disconnect restores the handle and reconnect attaches it again', async () => {
  const screen = render(html`
    <div data-testid="target"><span data-testid="handle">Move</span></div>
  `);
  const $target = (await screen.getByTestId('target').element()) as HTMLElement;
  const $handle = (await screen.getByTestId('handle').element()) as HTMLElement;
  const ctl = new DragController(createHost(), { target: $target, handle: $handle });

  ctl.hostConnected();
  ctl.hostDisconnected();
  expect($handle.hasAttribute('tabindex')).toBe(false);

  ctl.hostConnected();
  expect($handle.getAttribute('tabindex')).toBe('0');

  ctl.dispose();
});

test('dispose stops an active drag and releases its pointer', async () => {
  const screen = render(html`
    <div data-testid="target" style="position: fixed; left: 50px; top: 50px">
      <span data-testid="handle">Move</span>
    </div>
  `);
  const $target = (await screen.getByTestId('target').element()) as HTMLElement;
  const $handle = (await screen.getByTestId('handle').element()) as HTMLElement;
  const release = vi.spyOn($handle, 'releasePointerCapture').mockImplementation(() => {});

  vi.spyOn($handle, 'hasPointerCapture').mockReturnValue(true);

  const host = createHost();

  vi.spyOn(host, 'addController').mockImplementation((controller) => controller.hostConnected?.());

  const ctl = new DragController(host, { target: $target, handle: $handle });

  $handle.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 }));
  ctl.dispose();

  const left = $target.style.left;

  $handle.dispatchEvent(
    new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: 40 }),
  );

  expect($target.style.left).toBe(left);
  expect(release).toHaveBeenCalledWith(1);
});
