import { html, type ReactiveControllerHost } from 'lit';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-lit';

import { ResizeController, pinElementBox } from './ResizeController.js';

test('pinElementBox preserves visual geometry inside a containing block', async () => {
  const screen = render(html`
    <div data-testid="container" style="position: fixed; inset: 6rem 1rem 2rem; contain: layout;">
      <div
        data-testid="target"
        style="position: fixed; inset: auto 0 0; inline-size: 12rem; block-size: 8rem;"
      ></div>
    </div>
  `);
  const $container = (await screen.getByTestId('container').element()) as HTMLElement;
  const $target = (await screen.getByTestId('target').element()) as HTMLElement;
  const before = $target.getBoundingClientRect();

  pinElementBox($target);

  const after = $target.getBoundingClientRect();

  expect(Math.round(after.left)).toBe(Math.round(before.left));

  expect(Math.round(after.top)).toBe(Math.round(before.top));

  expect(Math.round(after.right)).toBe(Math.round(before.right));

  expect(Math.round(after.bottom)).toBe(Math.round(before.bottom));

  expect(Number.parseFloat($target.style.top)).toBeCloseTo(
    before.top - $container.getBoundingClientRect().top,
  );
});

function createHost(): ReactiveControllerHost {
  return {
    addController() {},
    removeController() {},
    requestUpdate() {},
    updateComplete: Promise.resolve(true),
  };
}

test('puts the resize grip at the end corner and resizes from it in RTL', async () => {
  const screen = render(html`
    <div
      dir="rtl"
      data-testid="target"
      style="position: fixed; top: 50px; left: 100px; inline-size: 200px; block-size: 100px;"
    ></div>
  `);
  const $target = (await screen.getByTestId('target').element()) as HTMLElement;
  const ctl = new ResizeController(createHost(), { target: $target, direction: 'both' });

  ctl.hostConnected();

  const $grip = $target.querySelector<HTMLElement>('[data-rc-resize-corner]');

  expect($grip).not.toBeNull();

  const box = $target.getBoundingClientRect();
  const grip = $grip!.getBoundingClientRect();

  // Bottom-left: the inline-end, block-end corner in RTL, as for native resize.
  expect(grip.left).toBeCloseTo(box.left, 0);
  expect(grip.bottom).toBeCloseTo(box.bottom, 0);

  // ArrowLeft drags that corner outward, widening the box from its left edge.
  $grip!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));

  const after = $target.getBoundingClientRect();

  expect(after.width).toBeGreaterThan(box.width);
  expect(after.right).toBeCloseTo(box.right, 0);

  ctl.hostDisconnected();
});
