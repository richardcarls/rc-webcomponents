import { html } from 'lit';
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-lit';

import { pinElementBox } from './ResizeController.js';

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
