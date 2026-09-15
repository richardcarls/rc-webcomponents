import { expect, test } from 'vitest';

import { getVisualViewportBounds } from './visualViewport.js';

test('getVisualViewportBounds returns visual viewport offsets and dimensions', () => {
  const bounds = getVisualViewportBounds({
    innerWidth: 900,
    innerHeight: 700,
    visualViewport: {
      offsetLeft: 25,
      offsetTop: 140,
      width: 420,
      height: 280,
    },
  } as unknown as Window);

  expect(bounds).toEqual({
    left: 25,
    top: 140,
    width: 420,
    height: 280,
    right: 445,
    bottom: 420,
  });
});

test('getVisualViewportBounds falls back to the layout viewport', () => {
  const bounds = getVisualViewportBounds({
    innerWidth: 900,
    innerHeight: 700,
  } as Window);

  expect(bounds).toEqual({
    left: 0,
    top: 0,
    width: 900,
    height: 700,
    right: 900,
    bottom: 700,
  });
});
