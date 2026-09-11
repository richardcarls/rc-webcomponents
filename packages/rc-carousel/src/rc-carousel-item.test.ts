import { html } from 'lit';
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-lit';

import './define.js';
import type { RCCarousel } from './rc-carousel.js';
import type { RCCarouselItem } from './rc-carousel-item.js';

async function settle(carousel: RCCarousel): Promise<void> {
  await carousel.updateComplete;

  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
}

test('reports its own N-of-M position as a default aria-label', async () => {
  const screen = render(html`
    <rc-carousel
      data-testid="carousel"
      aria-label="Featured recipes"
      style="inline-size: 20rem; block-size: 10rem"
    >
      <rc-carousel-item data-testid="item-0">One</rc-carousel-item>
      <rc-carousel-item data-testid="item-1">Two</rc-carousel-item>
    </rc-carousel>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  const first = (await screen.getByTestId('item-0').element()) as RCCarouselItem;
  const second = (await screen.getByTestId('item-1').element()) as RCCarouselItem;

  expect(first.getAttribute('aria-label')).toBe('1 of 2');
  expect(second.getAttribute('aria-label')).toBe('2 of 2');
});

test('preserves an authored aria-label instead of the computed position', async () => {
  const screen = render(html`
    <rc-carousel data-testid="carousel">
      <rc-carousel-item data-testid="item-0" aria-label="Beef Stew, plated">One</rc-carousel-item>
    </rc-carousel>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  const item = (await screen.getByTestId('item-0').element()) as RCCarouselItem;

  expect(item.getAttribute('aria-label')).toBe('Beef Stew, plated');
});

test('hides off-screen slides from assistive technology and the tab sequence', async () => {
  const screen = render(html`
    <rc-carousel data-testid="carousel" style="inline-size: 20rem; block-size: 10rem">
      <rc-carousel-item data-testid="item-0">
        <button type="button">One</button>
      </rc-carousel-item>
      <rc-carousel-item data-testid="item-1" style="inline-size: 20rem">
        <button type="button">Two</button>
      </rc-carousel-item>
    </rc-carousel>
  `);
  const carousel = (await screen.getByTestId('carousel').element()) as RCCarousel;

  await settle(carousel);

  await vi.waitFor(async () => {
    const first = (await screen.getByTestId('item-0').element()) as RCCarouselItem;

    expect(first.getAttribute('aria-hidden')).not.toBe('true');
  });

  const second = (await screen.getByTestId('item-1').element()) as RCCarouselItem;

  await vi.waitFor(() => {
    expect(second.getAttribute('aria-hidden')).toBe('true');
    expect(second.hasAttribute('inert')).toBe(true);
  });
});
